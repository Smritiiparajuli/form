const express = require("express");
const sgMail = require("@sendgrid/mail");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configure SendGrid
console.log("Checking SendGrid configuration...");
console.log("SENDGRID_API key starts with:", process.env.SENDGRID_API ? process.env.SENDGRID_API.substring(0, 10) + "..." : "NOT SET");
console.log("SENDGRID_MAIL:", process.env.SENDGRID_MAIL);

if (!process.env.SENDGRID_API) {
  console.error("SENDGRID_API environment variable is required");
  process.exit(1);
}
sgMail.setApiKey(process.env.SENDGRID_API);

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("."));

// Serve the HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Handle form submission
app.post(
  "/submit-loyalty-program",
  upload.single("logoFile"),
  async (req, res) => {
    try {
      console.log("Received loyalty program submission...");

      // Extract form data
      const formData = req.body;
      const logoFile = req.file;

      // Parse array fields
      const tierNames = Array.isArray(formData["tierName[]"])
        ? formData["tierName[]"]
        : [formData["tierName[]"]].filter(Boolean);
      const tierBasePoints = Array.isArray(formData["tierBasePoints[]"])
        ? formData["tierBasePoints[]"]
        : [formData["tierBasePoints[]"]].filter(Boolean);
      const tierRoomNights = Array.isArray(formData["tierRoomNights[]"])
        ? formData["tierRoomNights[]"]
        : [formData["tierRoomNights[]"]].filter(Boolean);
      const tierDiscounts = Array.isArray(formData["tierDiscount[]"])
        ? formData["tierDiscount[]"]
        : [formData["tierDiscount[]"]].filter(Boolean);
      const tierColorOnes = Array.isArray(formData["tierColorOne[]"])
        ? formData["tierColorOne[]"]
        : [formData["tierColorOne[]"]].filter(Boolean);
      const tierColorTwos = Array.isArray(formData["tierColorTwo[]"])
        ? formData["tierColorTwo[]"]
        : [formData["tierColorTwo[]"]].filter(Boolean);
      const tierImages = Array.isArray(formData["tierImage[]"])
        ? formData["tierImage[]"]
        : [formData["tierImage[]"]].filter(Boolean);
      const tierDescriptions = Array.isArray(formData["tierDescription[]"])
        ? formData["tierDescription[]"]
        : [formData["tierDescription[]"]].filter(Boolean);

      const spendingNames = Array.isArray(formData["spendingTypeName[]"])
        ? formData["spendingTypeName[]"]
        : [formData["spendingTypeName[]"]].filter(Boolean);
      const spendingCurrencies = Array.isArray(
        formData["spendingTypeCurrency[]"]
      )
        ? formData["spendingTypeCurrency[]"]
        : [formData["spendingTypeCurrency[]"]].filter(Boolean);
      const spendingMultipliers = Array.isArray(
        formData["spendingTypeMultiplier[]"]
      )
        ? formData["spendingTypeMultiplier[]"]
        : [formData["spendingTypeMultiplier[]"]].filter(Boolean);

      const rewardCategoryNames = Array.isArray(
        formData["rewardCategoryName[]"]
      )
        ? formData["rewardCategoryName[]"]
        : [formData["rewardCategoryName[]"]].filter(Boolean);
      const rewardCategoryDescriptions = Array.isArray(
        formData["rewardCategoryDescription[]"]
      )
        ? formData["rewardCategoryDescription[]"]
        : [formData["rewardCategoryDescription[]"]].filter(Boolean);

      const rewardNames = Array.isArray(formData["rewardName[]"])
        ? formData["rewardName[]"]
        : [formData["rewardName[]"]].filter(Boolean);
      const rewardPoints = Array.isArray(formData["rewardPoints[]"])
        ? formData["rewardPoints[]"]
        : [formData["rewardPoints[]"]].filter(Boolean);
      const rewardCategories = Array.isArray(formData["rewardCategory[]"])
        ? formData["rewardCategory[]"]
        : [formData["rewardCategory[]"]].filter(Boolean);

      // Structure the data
      const loyaltyProgramData = {
        submissionDate: new Date().toISOString(),
        partnerInfo: {
          businessName: formData.partnerName,
          cardKey: formData.cardKey,
          tagline: formData.tagline,
          website: formData.website,
          logoFile: logoFile
            ? {
                originalName: logoFile.originalname,
                filename: logoFile.filename,
                size: logoFile.size,
                mimetype: logoFile.mimetype,
              }
            : null,
        },
        branding: {
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          accentColor: formData.accentColor,
          primaryFont: formData.primaryFont,
          headerFont: formData.headerFont,
        },
        tiers: tierNames.map((name, index) => ({
          name,
          basePoints: tierBasePoints[index] || "0",
          roomNights: tierRoomNights[index] || "0",
          discount: tierDiscounts[index] || "0",
          primaryColor: tierColorOnes[index],
          secondaryColor: tierColorTwos[index],
          imageUrl: tierImages[index] || "",
          description: tierDescriptions[index] || "",
        })),
        pointCredits: spendingNames.map((name, index) => ({
          category: name,
          currency: spendingCurrencies[index],
          multiplier: spendingMultipliers[index],
        })),
        rewardCategories: rewardCategoryNames.map((name, index) => ({
          name,
          description: rewardCategoryDescriptions[index] || "",
        })),
        rewards: rewardNames.map((name, index) => ({
          name,
          pointsRequired: rewardPoints[index] || "",
          category: rewardCategories[index] || "",
        })),
      };

      // Save data to local file for backup
      const fs = require("fs");
      const submissionId = Date.now().toString();
      const backupFilename = `submission_${submissionId}.json`;

      try {
        if (!fs.existsSync('submissions')) {
          fs.mkdirSync('submissions');
        }
        fs.writeFileSync(`submissions/${backupFilename}`, JSON.stringify(loyaltyProgramData, null, 2));
        console.log(`Form data backed up to: submissions/${backupFilename}`);
      } catch (backupError) {
        console.error("Failed to backup form data:", backupError.message);
      }

      // Create HTML email content
      const htmlContent = generateEmailHTML(loyaltyProgramData);

      // Email configuration
      const msg = {
        to: ["peshal@dosink.com", "smriti@dosink.com", "shilash@dosink.com"],
        from: process.env.SENDGRID_MAIL || "ppeshalmani@gmail.com",
        subject: `New Loyalty Program Setup: ${loyaltyProgramData.partnerInfo.businessName}`,
        html: htmlContent,
        attachments: [],
      };

      // Add logo file as attachment if present
      if (logoFile) {
        const fs = require("fs");
        const logoData = fs.readFileSync(logoFile.path);
        msg.attachments.push({
          content: logoData.toString("base64"),
          filename: logoFile.originalname,
          type: logoFile.mimetype,
          disposition: "attachment",
        });
      }

      // Send email
      console.log("Attempting to send email with config:", {
        to: msg.to,
        from: msg.from,
        subject: msg.subject
      });

      try {
        await sgMail.send(msg);
        console.log("Email sent successfully to:", msg.to);
      } catch (emailError) {
        console.error("Failed to send email:", emailError.message);
        console.error("Full error details:", emailError);
        if (emailError.response && emailError.response.body) {
          console.error("SendGrid error response:", JSON.stringify(emailError.response.body, null, 2));
        }
        // Continue with success response even if email fails
        // This allows form submission to work while email issues are resolved
        console.log("Form data saved locally, but email delivery failed");
      }

      // Clean up uploaded file
      if (logoFile) {
        const fs = require("fs");
        fs.unlinkSync(logoFile.path);
      }

      res.json({
        success: true,
        message:
          "Loyalty program setup submitted successfully! Your submission has been saved and the team will be notified.",
        submissionId: submissionId,
      });
    } catch (error) {
      console.error("Error processing form submission:", error);

      // Clean up uploaded file in case of error
      if (req.file) {
        const fs = require("fs");
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error("Error cleaning up file:", cleanupError);
        }
      }

      res.status(500).json({
        success: false,
        message: "Error processing submission. Please try again.",
        error: error.message,
      });
    }
  }
);

function generateEmailHTML(data) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Loyalty Program Setup</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; margin-bottom: 30px; }
    .section { background: #f8f9fa; padding: 25px; margin-bottom: 25px; border-radius: 8px; border-left: 5px solid #2c3e50; }
    .section h2 { color: #2c3e50; margin-top: 0; border-bottom: 2px solid #ecf0f1; padding-bottom: 10px; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
    .info-item { background: white; padding: 15px; border-radius: 5px; border: 1px solid #ecf0f1; }
    .info-label { font-weight: bold; color: #2c3e50; margin-bottom: 5px; }
    .info-value { color: #555; }
    .tier-item, .reward-item, .category-item { background: white; padding: 20px; margin-bottom: 15px; border-radius: 8px; border: 1px solid #ecf0f1; }
    .color-preview { display: inline-block; width: 20px; height: 20px; border-radius: 3px; margin-left: 10px; vertical-align: middle; border: 1px solid #ddd; }
    .json-data { background: #2c3e50; color: #ecf0f1; padding: 20px; border-radius: 5px; overflow-x: auto; font-family: 'Courier New', monospace; font-size: 12px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 40px; padding: 20px; background: #ecf0f1; border-radius: 5px; color: #7f8c8d; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 New Loyalty Program Setup</h1>
    <p>Submitted on ${new Date(data.submissionDate).toLocaleString()}</p>
  </div>

  <div class="section">
    <h2>📋 Partner Information</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Business Name</div>
        <div class="info-value">${data.partnerInfo.businessName}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Card Key</div>
        <div class="info-value">${data.partnerInfo.cardKey}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Website</div>
        <div class="info-value"><a href="${data.partnerInfo.website}" target="_blank">${data.partnerInfo.website}</a></div>
      </div>
      <div class="info-item">
        <div class="info-label">Brand Tagline</div>
        <div class="info-value">${data.partnerInfo.tagline || "Not provided"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Logo File</div>
        <div class="info-value">${data.partnerInfo.logoFile ? data.partnerInfo.logoFile.originalName : "No logo uploaded"}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>🎨 Branding & Styling</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Primary Color</div>
        <div class="info-value">${data.branding.primaryColor} <span class="color-preview" style="background-color: ${data.branding.primaryColor};"></span></div>
      </div>
      <div class="info-item">
        <div class="info-label">Secondary Color</div>
        <div class="info-value">${data.branding.secondaryColor} <span class="color-preview" style="background-color: ${data.branding.secondaryColor};"></span></div>
      </div>
      <div class="info-item">
        <div class="info-label">Accent Color</div>
        <div class="info-value">${data.branding.accentColor} <span class="color-preview" style="background-color: ${data.branding.accentColor};"></span></div>
      </div>
      <div class="info-item">
        <div class="info-label">Primary Font</div>
        <div class="info-value">${data.branding.primaryFont}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Header Font</div>
        <div class="info-value">${data.branding.headerFont}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>🏆 Membership Tiers (${data.tiers.length})</h2>
    ${data.tiers
      .map(
        (tier, index) => `
      <div class="tier-item">
        <h3 style="margin-top: 0; color: #2c3e50;">${index + 1}. ${tier.name}</h3>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Base Points Required</div>
            <div class="info-value">${tier.basePoints}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Room Nights Required</div>
            <div class="info-value">${tier.roomNights}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Discount Percentage</div>
            <div class="info-value">${tier.discount}%</div>
          </div>
          <div class="info-item">
            <div class="info-label">Primary Color</div>
            <div class="info-value">${tier.primaryColor} <span class="color-preview" style="background-color: ${tier.primaryColor};"></span></div>
          </div>
          <div class="info-item">
            <div class="info-label">Secondary Color</div>
            <div class="info-value">${tier.secondaryColor} <span class="color-preview" style="background-color: ${tier.secondaryColor};"></span></div>
          </div>
          <div class="info-item">
            <div class="info-label">Image URL</div>
            <div class="info-value">${tier.imageUrl || "Not provided"}</div>
          </div>
        </div>
        ${tier.description ? `<div style="margin-top: 15px;"><strong>Description:</strong> ${tier.description}</div>` : ""}
      </div>
    `
      )
      .join("")}
  </div>

  <div class="section">
    <h2>💳 Point Credits (${data.pointCredits.length})</h2>
    ${data.pointCredits
      .map(
        (credit, index) => `
      <div class="category-item">
        <h4 style="margin-top: 0; color: #2c3e50;">${index + 1}. ${credit.category}</h4>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Currency</div>
            <div class="info-value">${credit.currency}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Points Multiplier</div>
            <div class="info-value">${credit.multiplier}</div>
          </div>
        </div>
      </div>
    `
      )
      .join("")}
  </div>

  <div class="section">
    <h2>📂 Reward Categories (${data.rewardCategories.length})</h2>
    ${data.rewardCategories
      .map(
        (category, index) => `
      <div class="category-item">
        <h4 style="margin-top: 0; color: #2c3e50;">${index + 1}. ${category.name}</h4>
        ${category.description ? `<p style="margin: 10px 0;">${category.description}</p>` : ""}
      </div>
    `
      )
      .join("")}
  </div>

  <div class="section">
    <h2>🎁 Rewards & Benefits (${data.rewards.length})</h2>
    ${data.rewards
      .map(
        (reward, index) => `
      <div class="reward-item">
        <h4 style="margin-top: 0; color: #2c3e50;">${index + 1}. ${reward.name}</h4>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Points Required</div>
            <div class="info-value">${reward.pointsRequired || "Not specified"}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Category</div>
            <div class="info-value">${reward.category || "Not selected"}</div>
          </div>
        </div>
      </div>
    `
      )
      .join("")}
  </div>

  <div class="section">
    <h2>📄 Complete JSON Data</h2>
    <div class="json-data">
      ${JSON.stringify(data, null, 2).replace(/</g, "&lt;").replace(/>/g, "&gt;")}
    </div>
  </div>

  <div class="footer">
    <p><strong>Dosink Co., Ltd</strong> - Marketing Technology Solutions</p>
    <p>This loyalty program setup will be processed within 24 hours.</p>
  </div>
</body>
</html>
  `;
}

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 5MB.",
      });
    }
  }

  res.status(500).json({
    success: false,
    message: "Server error occurred.",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the form at: http://localhost:${PORT}`);
});

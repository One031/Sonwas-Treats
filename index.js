import express from "express";
import bodyParser from "body-parser";
import nodemailer from "nodemailer";
import env from "dotenv";
import multer from "multer";

const app = express();
const port = 3000;

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
env.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => {
    res.render("home.ejs");
});

app.get("/home", (req, res) => {
    const contactSuccess = req.query.contactSuccess || false;
    const contactError = req.query.contactError || false;

    console.log("🔍 contactSuccess:", contactSuccess, "contactError:", contactError);

    try {
        res.render("home", { contactSuccess, contactError });
    } catch (error) {
        console.error("❌ Error rendering home.ejs:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/muffins", (req, res) => {
    res.render("muffins.ejs");
});

app.get("/celebration-cake", (req, res) => {
    res.render("celebration-cake.ejs");
});

app.get("/homemade-cake", (req, res) => {
    res.render("homemade-cake.ejs");
});

app.get("/cupcakes", (req, res) => {
    res.render("cupcakes.ejs");
});

app.get("/desserts", (req, res) => {
    res.render("desserts.ejs");
});

app.get("/order", (req, res) => {
    const product = req.query.product || "Select Product";
    const flavor = req.query.flavor || "Select Flavor";
    const dessert = req.query.dessert || "Select a Dessert";
    const success = req.query.success || false;  // Get success flag from query params

    res.render("order", { product, flavor, dessert, success });
});

app.post("/submit-order", upload.single("referenceImage"), async (req, res) => {
    const {
        customerName,
        customerEmail,
        customerPhone,
        product,
        flavor,
        size,
        notes,
        totalAmount,
        dessert,
        cupcakesQuantity,
        muffinsPackage,
        bentoPackage,
        bentoShape,
        bentoText,
        bentoTheme,
        bentoPackaging,
        bentoSpecialRequests,
        cakeTheme,
        customMessage,
        specialInstructions,
        date
    } = req.body;

    // Generate a unique receipt code (random 6-character string)
    const receiptCode = "ST-" + Math.random().toString(36).slice(2, 8).toUpperCase();

    let attachment = req.file ? {   // Check if a file was uploaded
        filename: req.file.originalname,
        path: req.file.path
    } : null;

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: [process.env.EMAIL_USER, customerEmail], // Send to bakery + customer
        subject: `New Order Received: ${product} (Receipt: ${receiptCode})`,
        html: `
        <!-- Email Header with Background Image -->
        <div style="
            background: url(https://i.postimg.cc/wvpgPRLV/background.jpg) no-repeat center center;
            background-size: cover;
            padding: 40px; 
            text-align: center; 
            color: black;
        ">
            <h1 style="font-family: 'Libre Baskerville', serif; font-size: 40px; margin: 0; color:white;">
                Sonwa's Treats
            </h1>
        </div>

        <h2 style="color:rgb(6, 6, 6); font-size: 24px; font-family: 'Libre Baskerville', serif; text-align: center;">
            Freshly Baked Cakes From Scratch
        </h2>
        <p style="font-size: 16px; color: #666; text-align: center;">
            Every treat is created with the best quality ingredients to ensure that our customers enjoy them at every occasion.
        </p>

        <h2 style="color: #333;">Order Confirmation</h2>
        <p>Thank you, <strong>${customerName}</strong>, for your order!</p>

            <h3>Order Receipt</h3>
            <p><strong>Receipt Code:</strong> ${receiptCode}</p>

        <h3>Order Details:</h3>
        <ul>
            <li><strong>Product:</strong> ${product}</li>
            <li><strong>Flavor:</strong> ${flavor || "N/A"}</li>
            <li><strong>Size:</strong> ${size}</li>
            <li><strong>Date:</strong> ${date}</li>
            ${product === "Celebration Cake" || product === "Cake"  ?
                `<li><strong>Cake Theme:</strong> ${cakeTheme}</li>
                <li><strong>Custom Message:</strong> ${customMessage || "N/A"}</li>
                <li><strong>Special Instructions:</strong> ${specialInstructions || "N/A"}</li>`
                : ""}
            ${product === "Cupcakes" ? 
                `<li><strong>Cupcake Quantity:</strong> ${cupcakesQuantity || "N/A"} </li>` : ""}
             ${product === "Bento Cake" ? 
                `<li><strong>Bento Package:</strong> ${bentoPackage || "N/A"} </li>
                 <li><strong>Bento Shape:</strong> ${bentoShape || "N/A"} </li>
                 <li><strong>Bento Text:</strong> ${bentoText || "N/A"} </li>
                <li><strong>Bento Theme:</strong> ${bentoTheme || "N/A"} </li>
                <li><strong>Bento Packaging:</strong> ${bentoPackaging || "N/A"} </li>
                <li><strong>Special Requests:</strong> ${bentoSpecialRequests || "N/A"} </li>
                ` 
                : ""}

                ${product === "Desserts" ? 
                    `<li><strong>Dessert:</strong> ${dessert || "N/A"} </li>` : ""}
                 ${product === "Muffins" ? 
                    `<li><strong>Muffins Package:</strong> ${muffinsPackage || "N/A"} </li>` : ""}
            <li><strong>Phone Number:</strong> ${customerPhone}</li>
            ${notes ? `<li><strong>Notes:</strong> ${notes}</li>` : ""}
        </ul>
        
        ${product !== "Celebration Cake" ||  product !== "Cake"?
                `<h2 style="color:rgb(2, 2, 2); text-align: center; font-size: 28px; margin-top: 20px;">
            Total Amount: R${totalAmount}
        </h2>`
                : ""}

        <p style="font-size: 14px; color: #666;">We will contact you soon to confirm your order.</p>
    `,
        attachments: attachment ? [attachment] : []

    };

    try {
        await transporter.sendMail(mailOptions);
        // Redirect back to order page with a success flag
        res.redirect("/order?success=1");
    } catch (error) {
        console.error("Error sending email:", error);
        res.redirect("/order?error=1");
    }
});




app.post("/send-contact", async (req, res) => {
    try {
        const { contactName, contactEmail, contactMessage } = req.body;

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Sent to business owner
            subject: `New Contact Message from ${contactName}`,
            html: `<h2>Contact Message</h2>
                   <p><strong>Name:</strong> ${contactName}</p>
                   <p><strong>Email:</strong> ${contactEmail}</p>
                   <p><strong>Message:</strong> ${contactMessage}</p>`
        });

        res.redirect("/home?contactSuccess=1");
    } catch (error) {
        console.error("Error sending contact form:", error);
        res.redirect("/home?contactError=1");
    }
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

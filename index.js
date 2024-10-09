//Copyright (c) 2022 Panshak Solomon

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import pdf from "html-pdf";
import { fileURLToPath } from "url";
import { dirname } from "path";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import invoiceRoutes from "./routes/invoices.js";
import clientRoutes from "./routes/clients.js";
import userRoutes from "./routes/userRoutes.js";

import profile from "./routes/profile.js";
import pdfTemplate from "./documents/index.js";
import emailTemplate from "./documents/email.js";

const app = express();

app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

app.use("/invoices", invoiceRoutes);
app.use("/clients", clientRoutes);
app.use("/users", userRoutes);
app.use("/profiles", profile);

// NODEMAILER TRANSPORT FOR SENDING INVOICE VIA EMAIL
const transporter = nodemailer.createTransport({
  host: process.env.SMPT_HOST,
  port: process.env.SMPT_PORT,
  service: process.env.SMPT_SERVICE,
  auth: {
    user: process.env.SMPT_MAIL,
    pass: process.env.SMPT_PASSWORD,
  },
});

var options = { format: "A4" };

//SEND PDF INVOICE VIA EMAIL
app.post("/send-pdf", (req, res) => {
  const { email, company } = req.body;

  pdf.create(pdfTemplate(req.body), options).toFile("invoice.pdf", (err) => {
    transporter.sendMail({
      from: ` Invoice Gen <${process.env.SMPT_MAIL}>`, // sender address
      to: `${email}`, // list of receivers
      replyTo: `${company.email}`,
      subject: `Invoice from ${
        company?.businessName ? company.businessName : company.name
      }`, // Subject line
      text: `Invoice from ${
        company?.businessName ? company.businessName : company.name
      }`, // plain text body
      html: emailTemplate(req.body), // html body
      attachments: [
        {
          filename: "invoice.pdf",
          path: `${__dirname}/invoice.pdf`,
        },
      ],
    });

    if (err) {
      res.send("Error while sending email: " + err);
      return;
    }
    res.send("Email sent successfully");
  });
});

//CREATE AND SEND PDF INVOICE
app.post("/create-pdf", (req, res) => {
  pdf.create(pdfTemplate(req.body), options).toFile("invoice.pdf", (err) => {
    if (err) {
      res.send("Error while creating PDF: " + err);
      return;
    }

    res.send("PDF created successfully");
  });
});

//SEND PDF INVOICE
app.get("/fetch-pdf", (req, res) => {
  res.sendFile(`${__dirname}/invoice.pdf`);
});

app.get("/", (req, res) => {
  res.send("SERVER IS RUNNING");
});

const DB_URL = process.env.DB_URL;

mongoose
  .connect(DB_URL)
  .then(() => console.log("Database connected successfully"))
  .catch((error) => console.log(error.message));

export default app;

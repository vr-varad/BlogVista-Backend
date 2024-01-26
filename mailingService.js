const nodemailer = require('nodemailer')
require('dotenv').config()
const Post = require('./models/Post')

async function sendMail(email, type,post=''){
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.email,
          pass: process.env.password,
        },
      });
      let postDoc =  ''
      if(type=='post'){
        postDoc = await Post.findById(post._id).populate('author',['username'])
      }
      const message1 = {
        subject: "Thanks for Subscribing to Our Blog!",
        text: `Dear ${email},\n\nThank you for subscribing to our blog. We're excited to have you on board!\n\nStay tuned for the latest updates, articles, and news from our blog.\n\nBest regards,\nThe Blog Team`,
        html: `
        <p>Dear ${email},</p>
        <p>Thank you for subscribing to our blog. We're excited to have you on board!</p>
        <p>Stay tuned for the latest updates, articles, and news from our blog.</p>
        <p>Best regards,<br>The Blog Team</p>
        `,
      };
      const message2 = {
        subject: `New Blog Post: ${postDoc.title}`,
        text: `Dear ${email},\n\nWe're excited to inform you about our latest blog post!\n\n[Author Name] has written a new article titled '[Post Title]'.\n\nSummary:\n[Post Summary]\n\nPublished on: [Creation Date]\n\nCheck it out on our website!\n\nBest regards,\nThe Blog Team`,
        html: `
        <p>Dear ${email},</p>
        <p>We're excited to inform you about our latest blog post!</p>
        <p><strong>${postDoc.author.username}</strong> has written a new article titled '<em>${postDoc.title}</em>'.</p>
        <p><strong>Summary:</strong></p>
        <p>${postDoc.summary}</p>
        <p><strong>Published on:</strong> ${new Date(postDoc.createdAt).toLocaleString(undefined, { timeZone: 'Asia/Kolkata' })}</p>
        <p>Best regards,<br>BlogVista</p>`
      };
      
      const message = type === 'post'?message2:message1
      async function main() {
        // send mail with defined transport object
        const info = await transporter.sendMail({
          from: process.env.email, 
          to: email, 
          subject: message['subject'], 
          text: message['text'], 
          html: message['html'], 
        });
        
        console.log("Message sent: %s", info.messageId);
      }
    main().catch(console.error);
}
module.exports = sendMail
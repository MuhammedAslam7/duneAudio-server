import Razorpay from "razorpay"

export const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET_KEY
})


// export const handler = async(req, res) => {
//     if(req.method == "POST") {
//         try {
//             const {amount} = req.body
//             const options = {
//                 amount: amount * 100,
//                 currency: "INR",
//                 receipt: "receipt_" + Math.random().toString(36).substring(7)
//             }

//             const order = await razorpay.orders.create(options)
//             console.log(order)
//             res.status(200).json(order)
//         } catch (error) {
//             res.status(500).json({ error: 'Error creating Razorpay order' });
            
//         }
//     } else {
//         res.setHeader('Allow', 'POST');
//     res.status(405).end('Method Not Allowed');
//     }
// }
import { Wallet } from "../model/walletSchema.js"
import Razorpay from 'razorpay';
import crypto from 'crypto';

export const getWallet = async (req, res) => {
    try {
      const {userId} = req.user;
  
      const wallet = await Wallet.findOne({ userId })
        .select('balance transactions')
        .sort({ 'transactions.date': -1 }); 
  
      if (!wallet) {
        return res.status(404).json({ 
          success: false, 
          message: "Wallet not found" 
        });
      }
  
      res.json({
        success: true,
        wallet: {
          balance: wallet.balance,
          transactions: wallet.transactions
        }
      });
    } catch (error) {
      console.error('Error in getWallet:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  };
//////////////////////////////////////////////////////////////////////

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET_KEY,
  });
  

  export const addMoneyToWallet = async (req, res) => {
    try {
      const { amount } = req.body;
      const userId = req.user._id; 
  
      const options = {
        amount: amount * 100,
        currency: 'INR',
        receipt: `wallet_${Date.now()}_${userId}`,
      };
  
      const order = await razorpay.orders.create(options);
  
      res.json({
        success: true,
        order,
        key: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      console.error('Error in addMoneyToWallet:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };
  /////////////////////////////////////////////////////////////////////////////////
  export const verifyPayment = async (req, res) => {
    try {
      const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        amount,
      } = req.body;
  
      const {userId} = req.user
  
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY)
        .update(body.toString())
        .digest('hex');
  
      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: 'Invalid signature',
        });
      }
      const wallet = await Wallet.findOneAndUpdate(
        { userId },
        {
          $inc: { balance: amount },
          $push: {
            transactions: {
              transactionId: razorpay_payment_id,
              amount: amount,
              description: 'Wallet top-up',
            },
          },
        },
        { new: true }
      );
  
      res.json({
        success: true,
        wallet,
      });
    } catch (error) {
      console.error('Error in verifyPayment:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  };
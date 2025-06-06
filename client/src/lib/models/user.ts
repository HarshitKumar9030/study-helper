import mongoose, { Schema, Document, Model } from 'mongoose';


export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
  emailVerified?: Date;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**

 * Both the Next.js app and Python backend should use the same schema structure
 * for data consistency. If you modify this schema, make similar updates in the
 * Python backend.
 */
const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      minlength: [2, 'Name must be at least 2 characters long'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(v: string) {
          return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: (props: any) => `${props.value} is not a valid email!`,
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    emailVerified: {
      type: Date,
    },
    image: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * User Model - Mongoose model
 * 
 * This exports the User model if it exists, or creates it if it doesn't.
 * This pattern prevents duplicate model errors in development.
 */
export const UserModel: Model<IUser> = 
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

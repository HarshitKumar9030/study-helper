import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import connectMongo from "@/lib/mongodb";
import { UserModel } from "@/lib/models/user";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    
    // Validate input
    if (!name || !email || !password) {
      return new NextResponse(
        JSON.stringify({ message: "Missing required fields" }),
        { status: 400 }
      );
    }
    
    if (password.length < 6) {
      return new NextResponse(
        JSON.stringify({ message: "Password must be at least 6 characters long" }),
        { status: 400 }
      );
    }
    
    await connectMongo();
    
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return new NextResponse(
        JSON.stringify({ message: "User with this email already exists" }),
        { status: 409 }
      );
    }
    
    const hashedPassword = await hash(password, 10);
      const user = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      role: "user", 
    });
    
    return NextResponse.json({
      message: "User registered successfully",
      user: {
        id: (user._id as any).toString(),
        name: user.name,
        email: user.email,
        apiKey: user.apiKey, // Include API key in response
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return new NextResponse(
      JSON.stringify({ message: "An error occurred during registration" }),
      { status: 500 }
    );
  }
}

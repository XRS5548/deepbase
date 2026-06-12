'use client'
import { authClient } from '@/lib/auth-client';
import React, { useEffect } from 'react'

export default function page() {
    const session =  authClient.useSession();

    

    const handlesubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const name = formData.get("name") as string;
        const password = formData.get("password") as string;
        authClient.signUp.email({
            email,
            password,
            name
        })
    }
    return (
        <div>
            <form onSubmit={handlesubmit}>
                <input type="text" name="name" placeholder='Name' />
                <input type="email" name="email" placeholder='Email' />
                <input type="password" name="password" placeholder='Password' />
                <button type='submit'>Sign Up</button>
            </form>
        </div>
    )
}

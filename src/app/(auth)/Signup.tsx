import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Form';
import { Heart, User, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signupError) {
        console.error('Signup Error:', signupError);
        throw signupError;
      }

      if (data.user) {
        if (!data.session) {
          // This happens if email confirmation is enabled
          setError('Please check your email to confirm your account before signing in.');
          return;
        }
        // Profile is automatically created by the Supabase Trigger
        // We navigate to role selection to let the user pick their role
        navigate('/role-selection');
      }
    } catch (err: any) {
      console.error('Signup Catch Error:', err);
      if (err.message?.includes('rate limit exceeded')) {
        setError('Too many signup attempts. Please wait a few minutes before trying again, or use a different email address.');
      } else {
        setError(err.message || 'Failed to sign up');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white p-8">
      <div className="mt-8 flex flex-col items-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Heart className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
        <p className="mt-2 text-gray-500">Start your personalized care journey today</p>
      </div>

      <form onSubmit={handleSignup} className="mt-10 space-y-5">
        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <Input
          label="Full Name"
          type="text"
          placeholder="John Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <p className="text-xs text-gray-400">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>

        <Button type="submit" className="w-full py-4 text-lg" isLoading={loading}>
          Create Account
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </form>

      <div className="mt-auto pt-8 text-center">
        <p className="text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-600 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

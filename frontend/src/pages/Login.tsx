import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { Waves, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';

// Global axios defaults for HTTP-Only cookies
axios.defaults.withCredentials = true;

const formSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
});

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      // Backend expects /api/auth/login
      const res = await axios.post('http://localhost:3001/api/auth/login', values);
      if (res.status === 200) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
    } catch (err: any) {
      if (err.response?.status === 429) {
         setErrorMsg('Too many login attempts. Please try again later.');
      } else {
         setErrorMsg(err.response?.data?.error || 'Failed to login');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row relative">
      {/* Absolute Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Left side: branding/illustration */}
      <div className="hidden md:flex flex-1 flex-col justify-center items-center p-12 relative overflow-hidden bg-surface">
        {/* Subtle decorative background blur */}
        <div className="absolute w-[600px] h-[600px] rounded-full bg-primary/10 blur-[100px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        
        <div className="z-10 flex flex-col items-center text-center space-y-6 max-w-md">
          <div className="p-4 bg-primary/10 rounded-2xl ring-1 ring-primary/20 shadow-2xl shadow-primary/20 mb-4">
             <Waves className="w-16 h-16 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-text">
            Smart Water<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Digital Twin
            </span>
          </h1>
         
        </div>
        
        {/* Abstract wavy lines */}
        <div className="absolute bottom-0 w-full h-1/3 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(ellipse at bottom, var(--color-primary) 0%, transparent 70%)' }}></div>
      </div>

      {/* Right side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <Card className="w-full max-w-md border-border bg-surface/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-2xl font-semibold tracking-tight text-text">Welcome back</CardTitle>
            <CardDescription className="text-text-muted">
              Enter your credentials to access the digital twin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {errorMsg && (
              <div className="mb-6 p-4 rounded-md bg-critical/10 border border-critical/20 flex items-center gap-3 text-critical text-sm">
                <AlertCircle className="w-4 h-4" />
                <p>{errorMsg}</p>
              </div>
            )}
            
            {success ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="w-16 h-16 bg-healthy/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-healthy" />
                </div>
                <p className="text-text font-medium">Authentication successful</p>
                <p className="text-text-muted text-sm">Redirecting to dashboard...</p>
              </div>
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-text font-medium text-sm">Username</label>
                  <Input 
                    placeholder="admin" 
                    {...form.register("username")}
                    className="bg-background border-border text-text placeholder:text-text-muted focus-visible:ring-primary h-11"
                  />
                  {form.formState.errors.username && (
                    <p className="text-critical text-sm mt-1">{form.formState.errors.username.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-text font-medium text-sm">Password</label>
                    <a href="#" className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">
                      Forgot password?
                    </a>
                  </div>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    {...form.register("password")}
                    className="bg-background border-border text-text placeholder:text-text-muted focus-visible:ring-primary h-11"
                  />
                  {form.formState.errors.password && (
                    <p className="text-critical text-sm mt-1">{form.formState.errors.password.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-primary hover:bg-primary-dark text-white shadow-md transition-all font-medium mt-4"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authenticating
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

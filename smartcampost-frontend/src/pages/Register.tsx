import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Package as PackageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RegisterRequest } from '@/types';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

export function Register() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'FR' | 'EN'>('EN');
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterRequest>();
  const password = watch('password');
  const phoneValue = watch('phone');

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const onSubmit = async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
        // Call backend register
        await apiClient.register({
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
          preferredLanguage: language,
          password: data.password,
        });

        toast.success('Registration successful! Please login.');
        navigate('/auth/login');
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <PackageIcon className="w-12 h-12 text-blue-600" />
          </div>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Join SmartCAMPOST today</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Enter your full name"
                {...register('fullName', { required: 'Full name is required' })}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  placeholder="+237 6XX XXX XXX"
                  {...register('phone', { required: 'Phone number is required' })}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    if (!phoneValue) {
                      toast.error('Enter phone number first');
                      return;
                    }
                    setIsSendingOtp(true);
                    try {
                      await apiClient.sendOtp(phoneValue);
                      setOtpSent(true);
                      toast.success('OTP sent to phone');
                    } catch (err) {
                      toast.error('Failed to send OTP');
                    } finally {
                      setIsSendingOtp(false);
                    }
                  }}
                  disabled={isSendingOtp}
                >
                  {isSendingOtp ? 'Sending...' : 'Send OTP'}
                </Button>
              </div>
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            {otpSent && (
              <div className="space-y-2">
                <Label htmlFor="otp">OTP</Label>
                <Input
                  id="otp"
                  placeholder="Enter OTP"
                  {...register('otp', { required: 'OTP is required' })}
                />
                {errors.otp && (
                  <p className="text-sm text-destructive">{errors.otp.message}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register('email')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Preferred Language</Label>
              <Select value={language} onValueChange={(val: string) => setLanguage(val as 'FR' | 'EN')}>
                <SelectTrigger placeholder={language === 'EN' ? 'English' : 'Français'} />
                <SelectContent>
                  <SelectItem value="EN">English</SelectItem>
                  <SelectItem value="FR">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <Link to="/auth/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

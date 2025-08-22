# Forgot Password and Reset Password Integration Guide

This guide explains how to integrate the forgot password and reset password functionality in your Flutter application.

## API Endpoints

### Base URL Configuration
```dart
final String baseUrl = Platform.isAndroid
    ? 'http://10.10.40.172:8000'  // Your server IP
    : 'http://localhost:8000';     // For iOS simulator
```

### 1. Forgot Password API

**Endpoint:** `POST /auth/forgotpassword`

```dart
Future<String> requestPasswordReset(String email) async {
  try {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/forgotpassword'),
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'email': email,
      }),
    ).timeout(
      const Duration(seconds: 15),
      onTimeout: () {
        throw TimeoutException('Connection timeout. Please try again.');
      },
    );

    final data = jsonDecode(response.body);
    
    if (response.statusCode == 200) {
      // OTP received successfully
      return data['data']['otp'];
    } else {
      throw Exception(data['message'] ?? 'Failed to request password reset');
    }
  } catch (e) {
    rethrow;
  }
}
```

### 2. Reset Password API

**Endpoint:** `POST /auth/resetpassword`

```dart
Future<void> resetPassword({
  required String email,
  required String otp,
  required String newPassword,
}) async {
  try {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/resetpassword'),
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'email': email,
        'otp': otp,
        'newPassword': newPassword,
      }),
    ).timeout(
      const Duration(seconds: 15),
      onTimeout: () {
        throw TimeoutException('Connection timeout. Please try again.');
      },
    );

    final data = jsonDecode(response.body);
    
    if (response.statusCode != 200) {
      throw Exception(data['message'] ?? 'Failed to reset password');
    }
  } catch (e) {
    rethrow;
  }
}
```

## Flutter UI Implementation

### 1. Forgot Password Screen

```dart
class ForgotPasswordScreen extends StatefulWidget {
  @override
  _ForgotPasswordScreenState createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _isLoading = false;

  Future<void> _handleForgotPassword() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final otp = await requestPasswordReset(_emailController.text);
      
      // Navigate to OTP verification screen
      if (mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ResetPasswordScreen(
              email: _emailController.text,
              otp: otp,
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Forgot Password')),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              TextFormField(
                controller: _emailController,
                decoration: InputDecoration(
                  labelText: 'Email',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.emailAddress,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter your email';
                  }
                  if (!value.contains('@')) {
                    return 'Please enter a valid email';
                  }
                  return null;
                },
              ),
              SizedBox(height: 20),
              ElevatedButton(
                onPressed: _isLoading ? null : _handleForgotPassword,
                child: _isLoading
                    ? CircularProgressIndicator()
                    : Text('Send Reset OTP'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }
}
```

### 2. Reset Password Screen

```dart
class ResetPasswordScreen extends StatefulWidget {
  final String email;
  final String otp;

  const ResetPasswordScreen({
    Key? key,
    required this.email,
    required this.otp,
  }) : super(key: key);

  @override
  _ResetPasswordScreenState createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _otpController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isLoading = false;

  Future<void> _handleResetPassword() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      await resetPassword(
        email: widget.email,
        otp: _otpController.text,
        newPassword: _passwordController.text,
      );

      if (mounted) {
        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Password reset successful')),
        );
        
        // Navigate back to login screen
        Navigator.of(context).pushNamedAndRemoveUntil(
          '/login',
          (route) => false,
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  void initState() {
    super.initState();
    _otpController.text = widget.otp; // Pre-fill OTP
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Reset Password')),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              TextFormField(
                controller: _otpController,
                decoration: InputDecoration(
                  labelText: 'OTP',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter OTP';
                  }
                  if (value.length != 6) {
                    return 'OTP must be 6 digits';
                  }
                  return null;
                },
              ),
              SizedBox(height: 20),
              TextFormField(
                controller: _passwordController,
                decoration: InputDecoration(
                  labelText: 'New Password',
                  border: OutlineInputBorder(),
                ),
                obscureText: true,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter new password';
                  }
                  if (value.length < 6) {
                    return 'Password must be at least 6 characters';
                  }
                  return null;
                },
              ),
              SizedBox(height: 20),
              TextFormField(
                controller: _confirmPasswordController,
                decoration: InputDecoration(
                  labelText: 'Confirm Password',
                  border: OutlineInputBorder(),
                ),
                obscureText: true,
                validator: (value) {
                  if (value != _passwordController.text) {
                    return 'Passwords do not match';
                  }
                  return null;
                },
              ),
              SizedBox(height: 20),
              ElevatedButton(
                onPressed: _isLoading ? null : _handleResetPassword,
                child: _isLoading
                    ? CircularProgressIndicator()
                    : Text('Reset Password'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _otpController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }
}
```

## Error Handling

The implementation includes proper error handling for:
- Network timeouts
- Invalid OTP
- Server errors
- Validation errors

## Navigation Flow

1. User clicks "Forgot Password" on login screen
2. User enters email on ForgotPasswordScreen
3. After successful OTP generation, user is taken to ResetPasswordScreen
4. After successful password reset, user is taken back to login screen

## Dependencies Required

Add these dependencies to your `pubspec.yaml`:

```yaml
dependencies:
  http: ^1.1.0  # For making HTTP requests
  flutter_secure_storage: ^9.0.0  # Optional: For secure storage
```

## Security Considerations

1. Always use HTTPS in production
2. Implement proper input validation
3. Handle timeout scenarios
4. Clear sensitive data when disposing screens
5. Consider implementing rate limiting for OTP requests
6. Add loading indicators during API calls
7. Implement proper error messages for different scenarios

## Testing

Test the following scenarios:
1. Valid email submission
2. Invalid email format
3. Non-existent email
4. Incorrect OTP
5. Expired OTP
6. Password mismatch
7. Network timeout
8. Server errors

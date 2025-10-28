# Google OAuth Integration Guide

## 🎯 Overview

This guide explains how to implement "Sign in with Google" functionality in your InstaVC People application.

---

## ✅ Backend Setup (COMPLETED)

### What's Been Implemented:

1. ✅ **User Model Updated**
   - Added `googleId` field
   - Added `profilePicture` field  
   - Added `authProvider` field ('local' or 'google')
   - Password is now optional for Google sign-ins

2. ✅ **Google Auth Controller Created**
   - `/auth/google` - Login/Signup with Google
   - `/auth/google/link` - Link Google to existing account
   - `/auth/google/unlink` - Unlink Google account

3. ✅ **Packages Installed**
   - `google-auth-library` - Google token verification
   - `passport` - Authentication middleware
   - `passport-google-oauth20` - Google OAuth strategy

---

## 🔧 Configuration Required

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API:
   - Navigate to **APIs & Services** → **Library**
   - Search for "Google+ API"
   - Click **Enable**

4. Create OAuth 2.0 Client ID:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Choose **Web application**
   - Add Authorized redirect URIs:
     ```
     http://localhost:8000/auth/google/callback
     https://yourdomain.com/auth/google/callback
     ```
   - **Download JSON** or copy **Client ID** and **Client Secret**

### Step 2: Update `.env` File

Replace the placeholders in your `.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_actual_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:8000/auth/google/callback
```

---

## 📱 Flutter Integration

### Step 1: Add Dependencies

Add to your `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  google_sign_in: ^6.1.5
  http: ^1.1.0
```

Run:
```bash
flutter pub get
```

### Step 2: Configure Android

In `android/app/build.gradle`:

```gradle
defaultConfig {
    // ... other settings
    minSdkVersion 19  // Google Sign-In requires minimum SDK 19
}
```

### Step 3: Configure iOS

In `ios/Runner/Info.plist`, add:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleTypeRole</key>
        <string>Editor</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>com.googleusercontent.apps.YOUR_REVERSED_CLIENT_ID</string>
        </array>
    </dict>
</array>
```

Replace `YOUR_REVERSED_CLIENT_ID` with your actual reversed client ID.

### Step 4: Create Google Sign-In Service

Create `lib/services/google_auth_service.dart`:

```dart
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class GoogleAuthService {
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: [
      'email',
      'profile',
      'https://www.googleapis.com/auth/user.phonenumbers.read', // Request phone number
    ],
  );

  final String baseUrl = 'http://localhost:8000'; // Change for production

  // Sign in with Google
  Future<Map<String, dynamic>?> signInWithGoogle() async {
    try {
      // Trigger Google Sign-In flow
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      
      if (googleUser == null) {
        // User canceled the sign-in
        return null;
      }

      // Get authentication details
      final GoogleSignInAuthentication googleAuth = 
          await googleUser.authentication;

      // Get ID token
      final String? idToken = googleAuth.idToken;

      if (idToken == null) {
        throw Exception('Failed to get ID token');
      }

      // Send ID token to your backend
      final response = await http.post(
        Uri.parse('$baseUrl/auth/google'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'idToken': idToken}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data;
      } else {
        throw Exception('Failed to authenticate with backend');
      }
    } catch (error) {
      print('Error signing in with Google: $error');
      return null;
    }
  }

  // Sign out
  Future<void> signOut() async {
    await _googleSignIn.signOut();
  }

  // Check if user is signed in
  Future<bool> isSignedIn() async {
    return await _googleSignIn.isSignedIn();
  }
}
```

### Step 5: Create Google Sign-In Button

Create `lib/widgets/google_signin_button.dart`:

```dart
import 'package:flutter/material.dart';
import '../services/google_auth_service.dart';

class GoogleSignInButton extends StatefulWidget {
  final Function(Map<String, dynamic>) onSuccess;
  final Function(String) onError;

  const GoogleSignInButton({
    Key? key,
    required this.onSuccess,
    required this.onError,
  }) : super(key: key);

  @override
  State<GoogleSignInButton> createState() => _GoogleSignInButtonState();
}

class _GoogleSignInButtonState extends State<GoogleSignInButton> {
  final GoogleAuthService _authService = GoogleAuthService();
  bool _isLoading = false;

  Future<void> _handleGoogleSignIn() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final result = await _authService.signInWithGoogle();
      
      if (result != null && result['success'] == true) {
        widget.onSuccess(result['data']);
      } else {
        widget.onError('Google sign-in failed');
      }
    } catch (e) {
      widget.onError('Error: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return ElevatedButton.icon(
      onPressed: _isLoading ? null : _handleGoogleSignIn,
      icon: _isLoading
          ? SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : Image.asset(
              'assets/google_logo.png',
              height: 24,
              width: 24,
            ),
      label: Text(
        _isLoading ? 'Signing in...' : 'Sign in with Google',
        style: TextStyle(fontSize: 16),
      ),
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: BorderSide(color: Colors.grey.shade300),
        ),
      ),
    );
  }
}
```

### Step 6: Use in Login Screen

```dart
import 'package:flutter/material.dart';
import '../widgets/google_signin_button.dart';

class LoginScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Login')),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Your existing email/password login form
            // ...
            
            SizedBox(height: 24),
            
            // Divider with "OR"
            Row(
              children: [
                Expanded(child: Divider()),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  child: Text('OR'),
                ),
                Expanded(child: Divider()),
              ],
            ),
            
            SizedBox(height: 24),
            
            // Google Sign-In Button
            GoogleSignInButton(
              onSuccess: (userData) {
                // Save token to secure storage
                final token = userData['token'];
                final user = userData['user'];
                
                // Navigate to home screen
                Navigator.pushReplacementNamed(context, '/home');
              },
              onError: (error) {
                // Show error message
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(error)),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## 🧪 Testing

### Test Backend Endpoint (Using Postman or cURL):

```bash
POST http://localhost:8000/auth/google
Content-Type: application/json

{
  "idToken": "your_google_id_token_here"
}
```

### Expected Response:

```json
{
  "success": true,
  "message": "Google login successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@gmail.com",
      "profilePicture": "https://lh3.googleusercontent.com/...",
      "authProvider": "google"
    },
    "token": "jwt_token_here"
  }
}
```

---

## 🔐 Security Best Practices

1. **Never expose Client Secret in frontend** - Only use Client ID in Flutter
2. **Always verify tokens on backend** - Never trust client-side validation
3. **Use HTTPS in production** - No plain HTTP for OAuth
4. **Store tokens securely** - Use flutter_secure_storage for JWT tokens
5. **Handle token expiration** - Implement refresh token logic

---

## 📊 API Endpoints Summary

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/auth/google` | No | Login/Signup with Google |
| POST | `/auth/google/link` | Yes | Link Google to existing account |
| POST | `/auth/google/unlink` | Yes | Unlink Google from account |

---

## 🐛 Common Issues & Solutions

### Issue 1: "Token used too late"
**Solution**: ID tokens expire quickly. Make sure to send them immediately after getting from Google.

### Issue 2: "Invalid value" on Google Sign-In
**Solution**: Check that your OAuth Client ID is correctly configured for Android/iOS.

### Issue 3: "Failed to get ID token"
**Solution**: Ensure `google_sign_in` package version is compatible with your Flutter SDK.

### Issue 4: Google Sign-In not working on iOS
**Solution**: Make sure you've added the reversed client ID in `Info.plist` correctly.

---

## 🚀 Next Steps

1. ✅ Configure Google Cloud Console OAuth
2. ✅ Update `.env` file with credentials
3. ✅ Implement Flutter UI
4. ✅ Test on both Android and iOS
5. ✅ Deploy to production with HTTPS

---

## 📞 Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify Google Cloud Console configuration
3. Ensure OAuth credentials match in .env file
4. Test with Postman first before Flutter integration

---

**Your backend is ready! Just add your Google OAuth credentials and start integrating with Flutter!** 🎉


# Flutter Authentication Implementation Guide

This guide explains how to implement authentication in your Flutter application using the InstaVC People Backend APIs.

## API Endpoints

Base URL: `http://your-backend-url:3000/api`

### Authentication APIs

#### 1. Sign Up
```dart
POST /auth/signup
```

**Request Body:**
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "123456"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "user": {
            "id": "user_id",
            "name": "John Doe",
            "email": "john@example.com"
        },
        "token": "jwt_token"
    }
}
```

#### 2. Login
```dart
POST /auth/login
```

**Request Body:**
```json
{
    "email": "john@example.com",
    "password": "123456"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "user": {
            "id": "user_id",
            "name": "John Doe",
            "email": "john@example.com"
        },
        "token": "jwt_token"
    }
}
```

#### 3. Get Current User
```dart
GET /auth/me
```

**Headers Required:**
```
Authorization: Bearer jwt_token
```

**Response:**
```json
{
    "success": true,
    "data": {
        "user": {
            "id": "user_id",
            "name": "John Doe",
            "email": "john@example.com"
        }
    }
}
```

## Flutter Implementation

### 1. Required Dependencies

Add these dependencies to your `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.1.0
  shared_preferences: ^2.2.0
  provider: ^6.0.5
  jwt_decoder: ^2.0.1
```

### 2. Create API Service

```dart
// lib/services/api_service.dart

import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences.dart';

class ApiService {
  final String baseUrl = 'http://your-backend-url:3000/api';
  final SharedPreferences _prefs;

  ApiService(this._prefs);

  // Get stored token
  String? get token => _prefs.getString('token');

  // Store token
  Future<void> setToken(String token) async {
    await _prefs.setString('token', token);
  }

  // Remove token
  Future<void> removeToken() async {
    await _prefs.remove('token');
  }

  // Headers with authentication
  Map<String, String> get _authHeaders => {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $token',
  };

  // Sign Up
  Future<Map<String, dynamic>> signUp({
    required String name,
    required String email,
    required String password,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/signup'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'name': name,
        'email': email,
        'password': password,
      }),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 201) {
      await setToken(data['data']['token']);
      return data;
    } else {
      throw Exception(data['message'] ?? 'Sign up failed');
    }
  }

  // Login
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 200) {
      await setToken(data['data']['token']);
      return data;
    } else {
      throw Exception(data['message'] ?? 'Login failed');
    }
  }

  // Get Current User
  Future<Map<String, dynamic>> getCurrentUser() async {
    if (token == null) throw Exception('Not authenticated');

    final response = await http.get(
      Uri.parse('$baseUrl/auth/me'),
      headers: _authHeaders,
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 200) {
      return data;
    } else {
      throw Exception(data['message'] ?? 'Failed to get user info');
    }
  }
}
```

### 3. Create Auth Provider

```dart
// lib/providers/auth_provider.dart

import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService;
  bool _isAuthenticated = false;
  Map<String, dynamic>? _user;

  AuthProvider(this._apiService) {
    _checkAuthStatus();
  }

  bool get isAuthenticated => _isAuthenticated;
  Map<String, dynamic>? get user => _user;

  Future<void> _checkAuthStatus() async {
    try {
      if (_apiService.token != null) {
        await getCurrentUser();
        _isAuthenticated = true;
      }
    } catch (e) {
      _isAuthenticated = false;
      _user = null;
    }
    notifyListeners();
  }

  Future<void> signUp({
    required String name,
    required String email,
    required String password,
  }) async {
    try {
      final response = await _apiService.signUp(
        name: name,
        email: email,
        password: password,
      );
      _user = response['data']['user'];
      _isAuthenticated = true;
      notifyListeners();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _apiService.login(
        email: email,
        password: password,
      );
      _user = response['data']['user'];
      _isAuthenticated = true;
      notifyListeners();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> getCurrentUser() async {
    try {
      final response = await _apiService.getCurrentUser();
      _user = response['data']['user'];
      notifyListeners();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> logout() async {
    await _apiService.removeToken();
    _isAuthenticated = false;
    _user = null;
    notifyListeners();
  }
}
```

### 4. Setup Provider in Main App

```dart
// lib/main.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences.dart';
import 'providers/auth_provider.dart';
import 'services/api_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  
  runApp(MyApp(prefs: prefs));
}

class MyApp extends StatelessWidget {
  final SharedPreferences prefs;

  const MyApp({Key? key, required this.prefs}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider(
          create: (_) => ApiService(prefs),
        ),
        ChangeNotifierProxyProvider<ApiService, AuthProvider>(
          create: (context) => AuthProvider(context.read<ApiService>()),
          update: (context, apiService, previous) => 
            previous ?? AuthProvider(apiService),
        ),
      ],
      child: MaterialApp(
        // Your app configuration
      ),
    );
  }
}
```

### 5. Example Usage in UI

```dart
// lib/screens/login_screen.dart

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      await context.read<AuthProvider>().login(
        email: _emailController.text,
        password: _passwordController.text,
      );
      // Navigate to home screen
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Login')),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _emailController,
                decoration: InputDecoration(labelText: 'Email'),
                validator: (value) =>
                    value?.isEmpty ?? true ? 'Please enter email' : null,
              ),
              TextFormField(
                controller: _passwordController,
                decoration: InputDecoration(labelText: 'Password'),
                obscureText: true,
                validator: (value) =>
                    value?.isEmpty ?? true ? 'Please enter password' : null,
              ),
              SizedBox(height: 16),
              ElevatedButton(
                onPressed: _isLoading ? null : _login,
                child: _isLoading
                    ? CircularProgressIndicator()
                    : Text('Login'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

## Error Handling

The API returns error responses in this format:

```json
{
    "success": false,
    "message": "Error message here",
    "error": "Detailed error information (only in development)"
}
```

Handle these errors appropriately in your Flutter app using try-catch blocks.

## Security Best Practices

1. Always store the JWT token securely using `shared_preferences`
2. Include the token in all authenticated requests
3. Handle token expiration and auto-logout
4. Validate user input before sending to the API
5. Use HTTPS in production
6. Don't store sensitive information in local storage

## Testing the Implementation

1. Start the backend server
2. Update the `baseUrl` in `ApiService` to match your server
3. Run the Flutter app
4. Test signup, login, and protected routes
5. Verify token storage and authentication state management
6. Test error scenarios and edge cases

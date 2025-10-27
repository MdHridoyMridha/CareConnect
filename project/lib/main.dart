import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

void main() {
  runApp(CareConnectApp());
}

class CareConnectApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'CareConnect',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: ChatScreen(),
    );
  }
}

class ChatMessage {
  final String text;
  final bool isUser;
  ChatMessage({required this.text, required this.isUser});
}

class ChatScreen extends StatefulWidget {
  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen>
    with SingleTickerProviderStateMixin {
  late stt.SpeechToText _speech;
  bool _isListening = false;
  late AnimationController _animationController;

  List<ChatMessage> _messages = [];

  @override
  void initState() {
    super.initState();
    _speech = stt.SpeechToText();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
      lowerBound: 0.8,
      upperBound: 1.2,
    )..addStatusListener((status) {
        if (status == AnimationStatus.completed) {
          _animationController.reverse();
        } else if (status == AnimationStatus.dismissed) {
          _animationController.forward();
        }
      });
  }

  void _toggleRecording() async {
    if (!_isListening) {
      bool available = await _speech.initialize();
      if (available) {
        setState(() {
          _isListening = true;
        });
        _animationController.forward();
        _speech.listen(onResult: (result) {
          if (result.finalResult) {
            String userText = result.recognizedWords;
            _addMessage(userText, true);

            // Placeholder AI response (you can replace with Hugging Face API)
            String aiResponse = "You said: \"$userText\"";
            _addMessage(aiResponse, false);

            setState(() {
              _isListening = false;
            });
            _animationController.stop();
            _speech.stop();
          }
        });
      } else {
        _addMessage("Speech recognition not available!", false);
      }
    } else {
      setState(() {
        _isListening = false;
      });
      _animationController.stop();
      _speech.stop();
    }
  }

  void _addMessage(String text, bool isUser) {
    setState(() {
      _messages.insert(0, ChatMessage(text: text, isUser: isUser));
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    _speech.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF0F2027), Color(0xFF203A43), Color(0xFF2C5364)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 20),
                child: Text(
                  "CareConnect",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                  ),
                ),
              ),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: ListView.builder(
                    reverse: true,
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      ChatMessage message = _messages[index];
                      return Align(
                        alignment: message.isUser
                            ? Alignment.centerRight
                            : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.symmetric(
                              vertical: 6, horizontal: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: message.isUser
                                ? Colors.blueAccent
                                : Colors.white.withOpacity(0.9),
                            borderRadius: BorderRadius.only(
                              topLeft: const Radius.circular(16),
                              topRight: const Radius.circular(16),
                              bottomLeft: Radius.circular(
                                  message.isUser ? 16 : 0), 
                              bottomRight: Radius.circular(
                                  message.isUser ? 0 : 16),
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.2),
                                blurRadius: 4,
                                offset: const Offset(2, 2),
                              ),
                            ],
                          ),
                          child: Text(
                            message.text,
                            style: TextStyle(
                              color:
                                  message.isUser ? Colors.white : Colors.black,
                              fontSize: 16,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
              const SizedBox(height: 10),
              ScaleTransition(
                scale: _animationController,
                child: GestureDetector(
                  onTap: _toggleRecording,
                  child: Container(
                    width: 90,
                    height: 90,
                    margin: const EdgeInsets.only(bottom: 20),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _isListening ? Colors.redAccent : Colors.blueAccent,
                      boxShadow: [
                        if (_isListening)
                          BoxShadow(
                            color: Colors.redAccent.withOpacity(0.6),
                            blurRadius: 20,
                            spreadRadius: 10,
                          ),
                      ],
                    ),
                    child: const Icon(
                      Icons.mic,
                      color: Colors.white,
                      size: 45,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/**
 * AI Chatbot Component - Enhanced with Role-Based Features
 * Interactive chatbot for customer support with role-specific responses
 * and full platform integration capability
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle,
  Send,
  X,
  Bot,
  User,
  Loader2,
  Minimize2,
  Package,
  CreditCard,
  MapPin,
  Clock,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  Users,
  Truck,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAIChat } from "@/hooks/ai/useAI";
import { useAuthStore } from "@/store/authStore"; // Use auth store for user role

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
  feedback?: "positive" | "negative" | null;
}

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  query: string;
}

// Knowledge base for common questions
const knowledgeBase: Record<string, string> = {
  // Tracking
  track: `To track your parcel, you can:
1. Go to "My Parcels" in your dashboard
2. Click on the parcel to see its current status
3. View the live map showing its journey

You can also enter your tracking code on the home page for quick tracking.`,

  // Pricing
  price: `Our pricing is based on:
- **Weight**: Charged per kg
- **Distance**: Based on origin and destination cities
- **Service Type**: Standard (3-5 days) or Express (1-2 days)

For a quote, create a new parcel and our system will calculate the cost automatically.`,

  cost: `Our pricing is based on:
- **Weight**: Charged per kg
- **Distance**: Based on origin and destination cities
- **Service Type**: Standard (3-5 days) or Express (1-2 days)

For a quote, create a new parcel and our system will calculate the cost automatically.`,

  // Delivery time
  delivery: `Delivery times depend on the service you choose:
- **Standard**: 3-5 business days
- **Express**: 1-2 business days

You can track your parcel in real-time on our map to see its progress.`,

  time: `Delivery times depend on the service you choose:
- **Standard**: 3-5 business days
- **Express**: 1-2 business days

You can track your parcel in real-time on our map to see its progress.`,

  // Payment
  payment: `We accept multiple payment methods:
- **Mobile Money**: Orange Money, MTN Mobile Money
- **Bank Transfer**: All major Cameroonian banks
- **Cash**: At our agencies

Payment is required before pickup. You'll receive a receipt via SMS.`,

  pay: `We accept multiple payment methods:
- **Mobile Money**: Orange Money, MTN Mobile Money
- **Bank Transfer**: All major Cameroonian banks
- **Cash**: At our agencies

Payment is required before pickup. You'll receive a receipt via SMS.`,

  // Pickup
  pickup: `For pickup scheduling:
1. Create your parcel with origin address
2. Choose a pickup date and time slot
3. Our courier will come to collect your package

You'll receive SMS notifications about your pickup status.`,

  collect: `For pickup scheduling:
1. Create your parcel with origin address
2. Choose a pickup date and time slot
3. Our courier will come to collect your package

You'll receive SMS notifications about your pickup status.`,

  // Lost/Damaged
  lost: `If your parcel is lost or damaged:
1. Go to Support in your dashboard
2. File a complaint with your tracking number
3. Our team will investigate within 24-48 hours

You may be eligible for compensation based on declared value.`,

  damage: `If your parcel is lost or damaged:
1. Go to Support in your dashboard
2. File a complaint with your tracking number
3. Our team will investigate within 24-48 hours

You may be eligible for compensation based on declared value.`,

  // Refund
  refund: `For refund requests:
1. Contact support with your payment receipt
2. Refunds are processed within 5-7 business days
3. Amount is credited back to original payment method

Note: Refunds are only available for unshipped parcels or service failures.`,

  // Agency locations
  agency: `You can find our agencies in major cities:
- **Douala**: Akwa, Bonaberi, Bonamoussadi
- **Yaoundé**: Mvog-Mbi, Bastos, Mvan
- **Bafoussam**: City Center
- **Garoua**: Main Avenue

Use our agency finder on the website for exact addresses and hours.`,

  location: `You can find our agencies in major cities:
- **Douala**: Akwa, Bonaberi, Bonamoussadi
- **Yaoundé**: Mvog-Mbi, Bastos, Mvan
- **Bafoussam**: City Center
- **Garoua**: Main Avenue

Use our agency finder on the website for exact addresses and hours.`,

  // Hours
  hours: `Our operating hours are:
- **Agencies**: Monday-Saturday, 8:00 AM - 6:00 PM
- **Customer Support**: Monday-Friday, 8:00 AM - 8:00 PM
- **Pickup/Delivery**: Monday-Saturday, 7:00 AM - 7:00 PM

We're closed on Sundays and public holidays.`,

  // Contact
  contact: `You can reach us through:
- **Phone**: +237 6XX XXX XXX
- **Email**: support@smartcampost.cm
- **WhatsApp**: +237 6XX XXX XXX
- **In-app Support**: File a ticket in your dashboard

Response time is typically within 2-4 hours during business hours.`,

  // Account
  account: `To manage your account:
- **Profile**: Update your personal information
- **Password**: Change in Settings > Security
- **Notifications**: Customize your preferences

For account deletion requests, please contact support.`,

  // Hello/Greeting
  hello: `Hello! 👋 Welcome to SmartCAMPOST support!

I'm your AI assistant and I can help you with:
- 📦 Tracking your parcels
- 💰 Pricing information
- 🚚 Delivery times
- 💳 Payment options
- ❓ Any other questions

What can I help you with today?`,

  hi: `Hello! 👋 Welcome to SmartCAMPOST support!

I'm your AI assistant and I can help you with:
- 📦 Tracking your parcels
- 💰 Pricing information
- 🚚 Delivery times
- 💳 Payment options
- ❓ Any other questions

What can I help you with today?`,

  help: `I can assist you with:

📦 **Tracking** - "Where is my parcel?"
💰 **Pricing** - "How much does shipping cost?"
🚚 **Delivery** - "How long will it take?"
💳 **Payment** - "What payment methods do you accept?"
📍 **Locations** - "Where are your agencies?"
🔒 **Account** - "How do I update my profile?"

Just type your question and I'll do my best to help!`,
};

// Quick action suggestions
const quickActions: QuickAction[] = [
  {
    icon: <Package className="w-4 h-4" />,
    label: "Track Parcel",
    query: "How do I track my parcel?",
  },
  {
    icon: <CreditCard className="w-4 h-4" />,
    label: "Pricing",
    query: "What are your prices?",
  },
  {
    icon: <Clock className="w-4 h-4" />,
    label: "Delivery Time",
    query: "How long does delivery take?",
  },
  {
    icon: <MapPin className="w-4 h-4" />,
    label: "Agencies",
    query: "Where are your agencies?",
  },
];

// Find best matching response from knowledge base
function findResponse(query: string): {
  response: string;
  suggestions: string[];
} {
  const lowercaseQuery = query.toLowerCase();

  // Check for keyword matches
  for (const [keyword, response] of Object.entries(knowledgeBase)) {
    if (lowercaseQuery.includes(keyword)) {
      return {
        response,
        suggestions: getRelatedSuggestions(keyword),
      };
    }
  }

  // Default response
  return {
    response: `I'm not sure I understand your question. Let me connect you with more options:

1. Try rephrasing your question
2. Use one of the quick actions below
3. Contact our support team for complex issues

I'm constantly learning to serve you better! 🤖`,
    suggestions: ["Track my parcel", "Pricing info", "Contact support"],
  };
}

function getRelatedSuggestions(keyword: string): string[] {
  const suggestions: Record<string, string[]> = {
    track: [
      "What if my parcel is delayed?",
      "Can I change the delivery address?",
    ],
    price: [
      "Is there a discount for bulk shipments?",
      "Do you offer insurance?",
    ],
    delivery: [
      "Can I schedule a specific time?",
      "What about weekend delivery?",
    ],
    payment: ["Can I pay on delivery?", "How do I get a receipt?"],
    pickup: ["Can someone else give the parcel?", "What if I miss the pickup?"],
    lost: [
      "How much compensation can I get?",
      "How long does investigation take?",
    ],
    agency: ["What are the opening hours?", "Can I drop off parcels there?"],
  };
  return suggestions[keyword] || ["Track my parcel", "Contact support"];
}

interface AIChatbotProps {
  isOpen?: boolean;
  onClose?: () => void;
  userPhone?: string;
}

export default function AIChatbot({
  isOpen: initialOpen = false,
  onClose,
  userPhone,
}: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const aiMutation = useAIChat();
  const { user } = useAuthStore(); // Get authenticated user and role

  // Generate role-specific welcome message and actions
  const getWelcomeContent = () => {
    if (!user) {
      return {
        message: `Hello! 👋 I'm SmartBot, your AI assistant.

I can help you with:
- 📦 Tracking parcels
- 💰 Pricing & payments
- 🚚 Delivery information
- 📍 Agency locations

How can I assist you today?`,
        suggestions: [
          "Track my parcel",
          "What are your prices?",
          "Find an agency",
        ],
      };
    }

    const role = user.role?.toUpperCase() || "CLIENT";
    
    if (role === "CLIENT") {
      return {
        message: `Hello ${user.fullName || "there"}! 👋 Welcome to SmartCAMPOST.

I can help you with:
- 📦 Track your parcels in real-time
- 💰 Get instant shipping quotes
- 🚚 Schedule pickups and deliveries
- 📍 Find our agency locations

What do you need help with today?`,
        suggestions: [
          "Track my parcel",
          "Create new shipment",
          "Check delivery rates",
        ],
      };
    } else if (role === "COURIER") {
      return {
        message: `Welcome back, ${user.fullName || "Courier"}! 🚚

I'm here to help you with:
- 📍 Optimize your delivery route
- 📦 View your assigned parcels
- 💰 Cash collection support
- 📊 Performance analytics

What do you need?`,
        suggestions: [
          "Show my assignments",
          "Optimize my route",
          "Update delivery status",
        ],
      };
    } else if (role === "AGENCY_ADMIN") {
      return {
        message: `Welcome, Agency Manager 🏢

I can assist you with:
- 📦 Parcel inventory management
- 👥 Staff and courier management
- 📊 Performance analytics & reports
- ⚠️ Alert management

What do you need today?`,
        suggestions: [
          "Parcel statistics",
          "Staff management",
          "Generate reports",
        ],
      };
    } else if (role === "ADMIN") {
      return {
        message: `Welcome, System Administrator ⚙️

I can help you with:
- 🌐 System-wide analytics
- 👥 User account management
- 🏢 Agency management
- 📋 Compliance reports

What do you need?`,
        suggestions: [
          "System analytics",
          "Manage users",
          "View all agencies",
        ],
      };
    }

    return {
      message: `Hello! 👋 I'm SmartBot, your AI assistant.

I can help you with:
- 📦 Tracking parcels
- 💰 Pricing & payments
- 🚚 Delivery information

What can I help you with?`,
      suggestions: ["Track my parcel", "Contact support"],
    };
  };

  const welcome = getWelcomeContent();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: welcome.message,
      timestamp: new Date(),
      suggestions: welcome.suggestions,
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Initialize user context
  useEffect(() => {
    if (user?.phone) {
      // User context is available for AI
      void user.phone;
    }
  }, [user]);

  const handleSend = useCallback(
    async (text?: string) => {
      const query = text || inputValue.trim();
      if (!query) return;

      // Add user message
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: query,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      setIsTyping(true);

      // Try streaming endpoint first (progressive renderer)
      const payload = {
        message: query,
        language: "en",
        context: userPhone || user?.phone || undefined,
        // Pass user role for AI context awareness
        userRole: user?.role,
      };
      try {
        setIsTyping(true);
        const res = await fetch(`/api/ai/chat/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Stream failed");

        const reader = res.body?.getReader();
        if (reader) {
          let assistantId = `assistant-${Date.now()}`;
          // create empty assistant message and append progressively
          setMessages((prev) => [
            ...prev,
            {
              id: assistantId,
              role: "assistant",
              content: "",
              timestamp: new Date(),
              suggestions: [],
              feedback: null,
            },
          ]);

          const decoder = new TextDecoder();
          let done = false;
          while (!done) {
            const { value, done: rdone } = await reader.read();
            done = rdone;
            if (value) {
              const chunk = decoder.decode(value);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + chunk }
                    : m,
                ),
              );
            }
          }
          setIsTyping(false);
          return;
        }
      } catch (err) {
        // Fall through to mutation-based call
        console.warn("Streaming failed, falling back", err);
      }

      try {
        // small delay for UX
        await new Promise((resolve) => setTimeout(resolve, 250));

        // Use react-query mutation with user context
        let aiResp = null;
        if (aiMutation) {
          aiResp = await aiMutation.mutateAsync({
            message: query,
            language: "en",
            context: userPhone || user?.phone || undefined,
          });
        } else {
          // fallback to local KB
          const fallback = findResponse(query);
          aiResp = {
            message: fallback.response,
            suggestions: fallback.suggestions,
          };
        }

        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content:
            aiResp.message || "Sorry, I couldn't process that right now.",
          timestamp: new Date(),
          suggestions: aiResp.suggestions || [],
          feedback: null,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const fallback = findResponse(query);
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: fallback.response,
          timestamp: new Date(),
          suggestions: fallback.suggestions,
          feedback: null,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } finally {
        setIsTyping(false);
      }
    },
    [inputValue, aiMutation, userPhone, user?.phone, user?.role],
  );

  const handleFeedback = (
    messageId: string,
    feedback: "positive" | "negative",
  ) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, feedback } : msg)),
    );
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  // Generate role-based quick actions
  const getQuickActions = (): QuickAction[] => {
    if (!user) {
      return [
        {
          icon: <Package className="w-4 h-4" />,
          label: "Track Parcel",
          query: "How do I track my parcel?",
        },
        {
          icon: <CreditCard className="w-4 h-4" />,
          label: "Pricing",
          query: "What are your prices?",
        },
        {
          icon: <MapPin className="w-4 h-4" />,
          label: "Agencies",
          query: "Where are your agencies?",
        },
      ];
    }

    const role = user.role?.toUpperCase() || "CLIENT";

    if (role === "CLIENT") {
      return [
        {
          icon: <Package className="w-4 h-4" />,
          label: "Track Parcel",
          query: "How do I track my parcel?",
        },
        {
          icon: <Package className="w-4 h-4" />,
          label: "Create Shipment",
          query: "How do I create a new shipment?",
        },
        {
          icon: <CreditCard className="w-4 h-4" />,
          label: "Get Quote",
          query: "Can you give me a shipping quote?",
        },
        {
          icon: <Clock className="w-4 h-4" />,
          label: "Delivery Time",
          query: "How long does delivery take?",
        },
      ];
    } else if (role === "COURIER") {
      return [
        {
          icon: <Truck className="w-4 h-4" />,
          label: "My Assignments",
          query: "Show me my delivery assignments",
        },
        {
          icon: <TrendingUp className="w-4 h-4" />,
          label: "Optimize Route",
          query: "Can you optimize my delivery route?",
        },
        {
          icon: <Package className="w-4 h-4" />,
          label: "Update Status",
          query: "How do I update delivery status?",
        },
        {
          icon: <CreditCard className="w-4 h-4" />,
          label: "Payment Tips",
          query: "Tips for collecting payments safely",
        },
      ];
    } else if (role === "AGENCY_ADMIN") {
      return [
        {
          icon: <BarChart3 className="w-4 h-4" />,
          label: "Parcel Stats",
          query: "Show me parcel inventory statistics",
        },
        {
          icon: <Users className="w-4 h-4" />,
          label: "Staff Mgmt",
          query: "How do I manage agency staff?",
        },
        {
          icon: <TrendingUp className="w-4 h-4" />,
          label: "Reports",
          query: "Generate agency performance report",
        },
        {
          icon: <AlertCircle className="w-4 h-4" />,
          label: "Alerts",
          query: "Show me active parcel alerts",
        },
      ];
    } else if (role === "ADMIN") {
      return [
        {
          icon: <BarChart3 className="w-4 h-4" />,
          label: "System Analytics",
          query: "Show system-wide analytics",
        },
        {
          icon: <Users className="w-4 h-4" />,
          label: "User Management",
          query: "Show user accounts dashboard",
        },
        {
          icon: <MapPin className="w-4 h-4" />,
          label: "Agencies",
          query: "List all agencies",
        },
        {
          icon: <TrendingUp className="w-4 h-4" />,
          label: "Reports",
          query: "Generate compliance report",
        },
      ];
    }

    return [];
  };

  const quickActions = getQuickActions();
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50 bg-blue-600 hover:bg-blue-700"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  // Minimized state
  if (isMinimized) {
    return (
      <div
        className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg cursor-pointer z-50 flex items-center gap-2"
        onClick={() => setIsMinimized(false)}
      >
        <Bot className="w-5 h-5" />
        <span>SmartBot</span>
        <Badge variant="secondary" className="bg-white/20">
          {messages.length}
        </Badge>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-95 max-h-150 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <CardHeader className="p-3 bg-blue-600 text-white rounded-t-lg flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-base text-white">SmartBot</CardTitle>
            <p className="text-xs text-white/80">AI Assistant • Online</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={() => setIsMinimized(true)}
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
            onClick={handleClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 max-h-100">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] ${
                  message.role === "user"
                    ? "bg-blue-600 text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl"
                    : "bg-muted text-foreground rounded-tl-2xl rounded-tr-2xl rounded-br-2xl"
                } p-3`}
              >
                <div className="flex items-start gap-2">
                  {message.role === "assistant" && (
                    <Bot className="w-4 h-4 mt-1 text-blue-600 shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>

                    {/* Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {message.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            className="px-2 py-1 text-xs border rounded-full hover:bg-blue-100 transition-colors"
                            onClick={() => handleSend(suggestion)}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Feedback buttons for assistant messages */}
                    {message.role === "assistant" &&
                      message.id !== "welcome" && (
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            className={`p-1 rounded ${
                              message.feedback === "positive"
                                ? "bg-green-100 text-green-600"
                                : "text-muted-foreground hover:text-green-600"
                            }`}
                            onClick={() =>
                              handleFeedback(message.id, "positive")
                            }
                            title="Helpful response"
                            aria-label="Mark as helpful"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button
                            className={`p-1 rounded ${
                              message.feedback === "negative"
                                ? "bg-red-100 text-red-600"
                                : "text-muted-foreground hover:text-red-600"
                            }`}
                            onClick={() =>
                              handleFeedback(message.id, "negative")
                            }
                            title="Not helpful response"
                            aria-label="Mark as not helpful"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                  </div>
                  {message.role === "user" && (
                    <User className="w-4 h-4 mt-1 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] opacity-60 mt-1 text-right">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl p-3 flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-600" />
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce animation-delay-150" />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce animation-delay-300" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="px-3 py-2 border-t flex gap-2 overflow-x-auto">
        {quickActions.map((action, idx) => (
          <Button
            key={idx}
            variant="outline"
            size="sm"
            className="shrink-0 text-xs"
            onClick={() => handleSend(action.query)}
          >
            {action.icon}
            <span className="ml-1">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Input */}
      <CardContent className="p-3 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isTyping}
          />
          <Button type="submit" disabled={!inputValue.trim() || isTyping}>
            {isTyping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Powered by SmartCAMPOST AI • Responses may not always be accurate
        </p>
      </CardContent>
    </Card>
  );
}

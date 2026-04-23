// Simple server without any ES module complications
console.log('Starting simple server...');

// Basic express setup without any complex imports
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Basic CORS - fixed for credentials
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// Basic routes
app.get('/test', (req, res) => {
  res.json({ message: 'Simple server is working!', timestamp: new Date().toISOString() });
});

// ===== Admin Support Tickets (stub for simple server) =====
app.get('/api/v1/admin/support/tickets', (req, res) => {
  res.json({ success: true, data: [], message: "Stub server: no tickets in memory." });
});

app.patch('/api/v1/admin/support/tickets/:id', (req, res) => {
  res.json({ success: true, data: { id: Number(req.params.id), ...req.body } });
});

app.delete('/api/v1/admin/support/tickets/:id', (req, res) => {
  res.json({ success: true, message: "Stub server: ticket deleted.", deleted: true });
});

app.post('/api/v1/admin/support/tickets/:id/reply', (req, res) => {
  res.json({ success: true, message: "Stub server: reply sent." });
});

// Full courses endpoint with complete content
app.get('/api/v1/courses', (req, res) => {
  res.json([
  {
    "id": 6,
    "title": "Program Orientation: Foundations Across the Four Pillars",
    "description": "This orientation course introduces the full learning architecture of the Academy. Learners map their current life position, define growth outcomes, and understand how the four pillars integrate into one development system. The orientation is designed to prepare learners for deep work, personal reflection, measurable progress, and applied transformation.",
    "price": 0,
    "thumbnail_url": "https://via.placeholder.com/300x200/4A90E2/FFFFFF?text=Orientation",
    "duration": "1 week",
    "level": "Beginner",
    "modules": [
      {
        "title": "Module 1: The Academy Blueprint",
        "lessons": [
          {
            "title": "Lesson 1.1: Why the Four Pillars Matter Together",
            "content": "The Academy is designed as an integrated system, not a collection of isolated topics. Mindset gives direction, productivity creates execution, leadership multiplies impact, and resilience sustains the journey. Growth is most durable when all four dimensions are trained together.",
            "duration": "15 minutes"
          },
          {
            "title": "Lesson 1.2: Personal Baseline Mapping",
            "content": "Learners complete a baseline self-assessment across confidence, procrastination patterns, communication, stress response, and purpose alignment. This baseline becomes the starting point for measurable progress through all courses.",
            "duration": "15 minutes"
          }
        ]
      },
      {
        "title": "Module 2: Learning for Transformation",
        "lessons": [
          {
            "title": "Lesson 2.1: Reflection, Practice, and Accountability",
            "content": "Transformation requires repetition. Learners are expected to complete weekly reflections, action tasks, and accountability check-ins. The principle is simple: insight without action does not produce change.",
            "duration": "15 minutes"
          },
          {
            "title": "Lesson 2.2: Building Your Commitment Contract",
            "content": "Each learner writes a commitment contract including daily practice habits, weekly review rituals, and a support partner. This commitment turns intention into structure.",
            "duration": "15 minutes"
          }
        ]
      }
    ]
  },
  {
    "id": 7,
    "title": "The Confidence Code: Building Unstoppable Self-Belief",
    "description": "Your mind is extraordinarily powerful. Your thoughts shape energy, emotions, and destiny. Confidence is not an inborn gift; it is a trainable identity built through intentional thinking, courageous action, and repeated self-trust. This course helps learners decode and strengthen inner belief so they can perform under pressure, recover from setbacks, and move forward with conviction.",
    "price": 299,
    "thumbnail_url": "https://via.placeholder.com/300x200/E74C3C/FFFFFF?text=Confidence",
    "duration": "4 weeks",
    "level": "Beginner",
    "pillar": "Mindset and Personal Mastery",
    "objectives": [
      "Understand how thoughts shape self-belief and behavior.",
      "Identify and challenge negative self-talk.",
      "Practice techniques that strengthen self-esteem and self-worth.",
      "Develop a growth-oriented mindset for challenges.",
      "Act confidently in uncertain situations."
    ],
    "modules": [
      {
        "title": "Module 1: The Psychology of Confidence",
        "lessons": [
          {
            "title": "Lesson 1.1: Confidence Begins in Thought",
            "content": "Confidence begins in the mind. Dominant thoughts become dominant behavior. Your self-concept acts as an internal thermostat, regulating how far you allow yourself to go. When you repeatedly see yourself as capable, the brain aligns emotion and action with that identity. Repetition of constructive self-belief builds neural pathways that make confidence feel natural.\n\nQuote focus: \"As a man thinketh in his heart, so is he\" (Proverbs 23:7).",
            "duration": "20 minutes"
          },
          {
            "title": "Lesson 1.2: Self-Image and Performance",
            "content": "Performance is often a mirror of identity. People who believe they are resourceful, worthy, and able to learn from failure are more likely to take initiative. This lesson introduces self-image recalibration through reflection prompts and identity-based affirmations.",
            "duration": "20 minutes"
          }
        ]
      },
      {
        "title": "Module 2: Breaking the Cycle of Self-Doubt",
        "lessons": [
          {
            "title": "Lesson 2.1: Spotting the Voice of Doubt",
            "content": "Self-doubt grows through comparison, harsh self-judgment, and fixation on past failure. Confidence grows through evidence of progress. Learners will identify their top recurring doubt scripts and replace them with growth statements.",
            "duration": "20 minutes"
          },
          {
            "title": "Lesson 2.2: Reframing Through Micro-Wins",
            "content": "Use a daily victory log: write three actions you completed, even small ones. This trains the mind to recognize capability instead of deficiency. Every confident person once felt uncertain; confidence develops when action continues anyway.",
            "duration": "20 minutes"
          }
        ]
      },
      {
        "title": "Module 3: The Habit of Bold Action",
        "lessons": [
          {
            "title": "Lesson 3.1: Courage in Practice",
            "content": "Courage is not the absence of fear but movement despite fear. Each bold action creates memory evidence that reduces future hesitation. Start with small risks: speak up, share a viewpoint, initiate a difficult conversation, or volunteer for responsibility.",
            "duration": "20 minutes"
          },
          {
            "title": "Lesson 3.2: Action Creates Confidence",
            "content": "Confidence is built through repetition, not luck. Learners practice the 24-hour courage rule: take one action within 24 hours of identifying an opportunity.\n\nQuote focus: \"Faith without works is dead\" (James 2:17).",
            "duration": "20 minutes"
          }
        ]
      },
      {
        "title": "Module 4: Building Inner Strength and Long-Term Confidence",
        "lessons": [
          {
            "title": "Lesson 4.1: Resilience Over Perfection",
            "content": "True confidence does not come from being flawless. It comes from recovering quickly and staying anchored when life shakes you. Learners develop a resilience routine using reflection, affirmations, and emotional reset tools.",
            "duration": "20 minutes"
          },
          {
            "title": "Lesson 4.2: The Confidence Code in Daily Life",
            "content": "Live confidently by reframing challenges as growth opportunities, choosing progress over perfection, and recalling past victories before high-pressure tasks.\n\nAffirmation model: \"I am capable. I am growing. I am enough.\"\n\nQuote focus: \"I can do all things through Christ who strengthens me\" (Philippians 4:13).",
            "duration": "20 minutes"
          }
        ]
      }
    ],
    "final_reflection": "Confidence is cultivated daily through awareness, action, and faith. Your thoughts are seeds; plant confidence and you harvest courage, consistency, and results."
  },
  {
    "id": 8,
    "title": "Overcoming Negative Thinking: Rewiring Your Brain for Positivity",
    "description": "Negative thinking is not destiny. It is a learned mental program that can be unlearned through neuroplasticity, awareness, and disciplined cognitive practice. This course teaches learners to identify destructive thought patterns, challenge distortions, and build emotional clarity, optimism, and resilience.",
    "price": 349,
    "thumbnail_url": "https://via.placeholder.com/300x200/F39C12/FFFFFF?text=Positive+Mindset",
    "duration": "5 weeks",
    "level": "Beginner to Intermediate",
    "pillar": "Mindset and Personal Mastery",
    "objectives": [
      "Explain how negative thinking develops and influences well-being.",
      "Identify common cognitive distortions.",
      "Apply practical methods to interrupt and replace negative thoughts.",
      "Build optimism and resilience through daily mental habits.",
      "Create a long-term strategy for mental balance."
    ],
    "modules": [
      {
        "title": "Module 1: The Science of Thought",
        "lessons": [
          {
            "title": "Lesson 1.1: Neuroplasticity and Mental Patterns",
            "content": "Your brain rewires based on repetition. Each thought strengthens a pathway. Repeated negative thoughts train the brain to scan for danger; repeated constructive thoughts train it to notice options and resources. Thought management is future management.",
            "duration": "25 minutes"
          },
          {
            "title": "Lesson 1.2: Emotional Chemistry of Thought",
            "content": "Negative thoughts trigger stress chemistry and narrowed perception. Constructive thoughts increase calm, motivation, and creativity. This lesson introduces a thought-chemistry tracker to map triggers and emotional outcomes.",
            "duration": "25 minutes"
          }
        ]
      },
      {
        "title": "Module 2: The Nature of Negative Thinking",
        "lessons": [
          {
            "title": "Lesson 2.1: Core Beliefs and Internal Scripts",
            "content": "Many negative beliefs begin in early emotional experiences and become internal scripts: \"I am not enough,\" \"Nothing works out for me,\" or \"I cannot trust anyone.\" Learners identify and map their top three inherited scripts.",
            "duration": "25 minutes"
          },
          {
            "title": "Lesson 2.2: Beliefs vs. Events",
            "content": "Following REBT principles, distress is often created by interpretation rather than event alone. The shift begins when learners ask: What happened? What did I tell myself it means? Is that story fully true?",
            "duration": "25 minutes"
          }
        ]
      },
      {
        "title": "Module 3: Recognizing Cognitive Distortions",
        "lessons": [
          {
            "title": "Lesson 3.1: Distortion Types and Detection",
            "content": "Key distortions include catastrophizing, personalization, all-or-nothing thinking, and filtering. Labeling a distortion weakens its emotional grip and creates mental distance from it.",
            "duration": "25 minutes"
          },
          {
            "title": "Lesson 3.2: Distortion-to-Truth Practice",
            "content": "Learners convert distorted statements into balanced truth statements. Example: \"If this fails, everything is over\" becomes \"This may be difficult, but one event does not define my future.\"",
            "duration": "25 minutes"
          }
        ]
      },
      {
        "title": "Module 4: Rewiring for Positivity",
        "lessons": [
          {
            "title": "Lesson 4.1: Interrupt, Question, Replace",
            "content": "Use a 3-step reset: Interrupt the thought, question its accuracy, replace it with a constructive alternative. Practice this repeatedly until it becomes automatic under stress.",
            "duration": "25 minutes"
          },
          {
            "title": "Lesson 4.2: Systemizing Better Thinking",
            "content": "Goals do not sustain mindset change; systems do. Learners build a daily thinking system with morning intention, midday reset, and evening reframing review.",
            "duration": "25 minutes"
          }
        ]
      },
      {
        "title": "Module 5: Gratitude, Perspective, and Environment",
        "lessons": [
          {
            "title": "Lesson 5.1: Gratitude as Cognitive Training",
            "content": "Gratitude is not denial of pain; it is disciplined attention to what is still working. Daily gratitude practice shifts perception from scarcity toward resourcefulness and strengthens motivation.",
            "duration": "25 minutes"
          },
          {
            "title": "Lesson 5.2: Designing a Positive Mental Ecosystem",
            "content": "Your environment shapes your mental tone. Curate inputs: conversations, media, books, and communities. Positivity becomes sustainable when your ecosystem supports it.",
            "duration": "25 minutes"
          }
        ]
      }
    ],
    "final_reflection": "Negative thinking is a habit, not an identity. Every constructive thought is a vote for the person you are becoming."
  },
  {
    "id": 9,
    "title": "Overcoming Procrastination: How to Get Things Done Now",
    "description": "Procrastination is not a time problem. It is a regulation problem where short-term comfort overrides meaningful action. This course helps learners understand the psychology behind delay and build systems that turn intention into consistent execution.",
    "price": 379,
    "thumbnail_url": "https://via.placeholder.com/300x200/27AE60/FFFFFF?text=Action+Now",
    "duration": "5 weeks",
    "level": "Beginner",
    "pillar": "Productivity and Success Strategies",
    "objectives": [
      "Identify psychological causes of procrastination.",
      "Understand emotional triggers of delay and avoidance.",
      "Apply science-backed anti-procrastination techniques.",
      "Build self-discipline and an execution mindset.",
      "Create sustainable systems for consistent output."
    ],
    "modules": [
      {
        "title": "Module 1: The Psychology Behind Procrastination",
        "lessons": [
          {
            "title": "Lesson 1.1: Why We Delay",
            "content": "Procrastination is often emotional mismanagement, not laziness. We avoid tasks that trigger discomfort: fear of failure, uncertainty, frustration, or perfection pressure. Understanding this reduces self-blame and improves strategy selection.",
            "duration": "25 minutes"
          },
          {
            "title": "Lesson 1.2: Mood Repair vs. Long-Term Reward",
            "content": "The brain prefers immediate relief over delayed reward. Learners map their common comfort substitutions (scrolling, avoidance tasks, over-planning) and design response alternatives.",
            "duration": "25 minutes"
          }
        ]
      },
      {
        "title": "Module 2: The Illusion of Later",
        "lessons": [
          {
            "title": "Lesson 2.1: Future-Self Myth",
            "content": "\"Later\" feels strategic but often postpones the same emotional difficulty. The future self is likely to face the same resistance unless systems change now.",
            "duration": "25 minutes"
          },
          {
            "title": "Lesson 2.2: Decision Management",
            "content": "Execution improves when decisions are pre-made. Learners apply if-then rules: \"If it is 8:00 PM, I begin 25 minutes of focused study.\" Reducing decision friction reduces delay.",
            "duration": "25 minutes"
          }
        ]
      },
      {
        "title": "Module 3: Emotional Resistance and the Fear of Starting",
        "lessons": [
          {
            "title": "Lesson 3.1: Activation Threshold",
            "content": "Starting is the hardest part. Once action begins, resistance drops. Learners use activation rituals and countdown entry methods to lower start friction.",
            "duration": "25 minutes"
          },
          {
            "title": "Lesson 3.2: The 2-Minute Rule",
            "content": "Start with a two-minute version of the task: open the file, write one line, read one paragraph, wear gym shoes. Initial motion generates momentum and dopamine reinforcement.",
            "duration": "25 minutes"
          }
        ]
      },
      {
        "title": "Module 4: Perfectionism and Momentum",
        "lessons": [
          {
            "title": "Lesson 4.1: Perfectionism as Hidden Delay",
            "content": "Many delays are fear of imperfect output. The shift is from perfection to iteration: produce draft one, then improve. Progress compounds; perfection stalls.",
            "duration": "25 minutes"
          },
          {
            "title": "Lesson 4.2: Small Wins Framework",
            "content": "Break tasks into low-friction substeps, complete one visible unit at a time, and celebrate completion. Momentum is built from consistency, not intensity.",
            "duration": "25 minutes"
          }
        ]
      },
      {
        "title": "Module 5: Environment, Focus, and Accountability",
        "lessons": [
          {
            "title": "Lesson 5.1: Designing for Focus",
            "content": "Use a distraction-resistant setup: clean workspace, muted notifications, and time-boxed focus intervals (Pomodoro). Protect attention like a limited asset.",
            "duration": "25 minutes"
          },
          {
            "title": "Lesson 5.2: Accountability Systems",
            "content": "Public commitments increase follow-through. Learners build accountability loops with peers, mentors, or digital trackers. The principle is simple: what gets reported gets done.",
            "duration": "25 minutes"
          }
        ]
      }
    ],
    "final_reflection": "The question is no longer \"Can I do it?\" but \"Will I start now?\" Action in small consistent steps rewrites identity into someone who follows through."
  }
]);
});

// Individual course endpoint with full details
app.get('/api/v1/courses/:id', (req, res) => {
  const courseId = parseInt(req.params.id);
  const course = fullCoursesData.find(c => c.id === courseId);
  
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }
  
  res.json(course);
});

// Admin login
app.post('/api/v1/admin/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@vialifecoach.com' && password === 'admin123') {
    res.json({
      success: true,
      message: "Login successful",
      token: "simple-token-" + Date.now(),
      user: {
        id: 1,
        name: 'Admin User',
        email: 'admin@vialifecoach.com',
        role: 'admin'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Invalid credentials"
    });
  }
});

// Auth endpoints for frontend
app.get('/api/v1/auth/me', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 1,
      name: 'Admin User',
      email: 'admin@vialifecoach.com',
      role: 'admin',
      avatar: null
    }
  });
});

app.get('/api/v1/admin/auth/me', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 1,
      name: 'Admin User',
      email: 'admin@vialifecoach.com',
      role: 'admin',
      avatar: null
    }
  });
});

app.post('/api/v1/auth/refresh-token', (req, res) => {
  res.json({
    success: true,
    token: 'simple-token-' + Date.now(),
    user: { id: 1, role: 'admin' }
  });
});

app.post('/api/v1/admin/auth/refresh-token', (req, res) => {
  res.json({
    success: true,
    token: 'simple-token-' + Date.now(),
    user: { id: 1, role: 'admin' }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple server running on http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log(`   GET  /test - Test server`);
  console.log(`   GET  /api/v1/courses - Get courses with full content (${fullCoursesData.length} courses)`);
  console.log(`   GET  /api/v1/courses/:id - Get individual course with modules & lessons`);
  console.log(`   POST /api/v1/admin/auth/login - Admin login`);
  console.log(`   GET  /api/v1/auth/me - Get current user`);
  console.log(`   GET  /api/v1/admin/auth/me - Get admin user`);
  console.log(`   POST /api/v1/auth/refresh-token - Refresh token`);
  console.log(`   POST /api/v1/admin/auth/refresh-token - Refresh admin token`);
  console.log('');
  console.log('📚 Course Content Available:');
  fullCoursesData.forEach(course => {
    console.log(`   - ${course.title}: ${course.modules.length} modules, ${course.modules.reduce((total, mod) => total + mod.lessons.length, 0)} lessons`);
  });
});

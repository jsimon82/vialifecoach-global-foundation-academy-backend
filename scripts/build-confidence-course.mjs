import { pool } from "../src/config/postgres.js";

const COURSE_TITLE = "The Confidence Code: Building Unstoppable Self-Belief";
const INTRO_MODULE_TITLE = "Module 0: Introduction";

const lessonsByModule = {
  introduction: [
    {
      title: "Lesson 0.1 - Welcome to the Confidence Code",
      duration: 8,
      text: [
        "Welcome to The Confidence Code. This course is built to help you develop a confident mind, steady emotions, and consistent action.",
        "Confidence is not reserved for a special group of people. It is a skill you can practice. It grows through how you think, how you respond to fear, and how you treat yourself when you make mistakes.",
        "In this course you will learn how confidence works in the brain, how to interrupt self-doubt, and how to build the habit of bold action. You will also explore how faith, mindset, and resilience work together to create inner strength.",
        "By the end of this course you will be able to manage negative thinking, take action even when afraid, develop strong inner belief, and live with greater freedom and purpose.",
        "This journey requires honesty with yourself and a willingness to grow. Confidence grows through practice, reflection, and consistent action. Use this course slowly and intentionally. Write down what you learn. Try the exercises. Build your confidence step by step."
      ].join("\n\n"),
      prompts: [
        "Why did you enroll in this course?",
        "Where in your life do you want stronger confidence?",
        "What would your life look like if you believed in yourself fully?"
      ]
    },
    {
      title: "Lesson 0.2 - What Confidence Really Means",
      duration: 8,
      text: [
        "Many people misunderstand confidence. They believe confident people are never afraid, never make mistakes, or always succeed. That is not true.",
        "Confidence does not mean the absence of fear. Confidence means moving forward despite fear.",
        "Confident individuals experience doubt like everyone else. The difference is they do not allow doubt to control their actions.",
        "True confidence includes believing you can learn new things, trusting your ability to adapt, accepting mistakes as part of growth, and staying committed even when things feel difficult.",
        "Confidence is built through experience. Every small action you take strengthens your belief in yourself. Over time, you begin to see yourself as someone who can handle challenges, and that identity becomes real."
      ].join("\n\n"),
      prompts: [
        "What is your current definition of confidence?",
        "When was the last time you acted despite fear?",
        "What small action could you take this week to build confidence?"
      ]
    }
  ],
  module1: [
    {
      title: "Lesson 1.1 - How Confidence Begins in the Mind",
      duration: 10,
      text: [
        "Confidence is deeply connected to how you think about yourself. Your mind constantly creates beliefs about your abilities. These beliefs influence your behavior, decisions, and willingness to take risks.",
        "If your mind believes you are capable, it encourages action. If your mind believes you are incapable, it creates hesitation and fear.",
        "Confidence is therefore a mental pattern formed by repeated thoughts and experiences. The good news is that thoughts are not fixed. They can be trained and redirected.",
        "Developing confidence starts by recognizing how your mind shapes your reality. When you notice a limiting belief, you can challenge it and replace it with a stronger one."
      ].join("\n\n"),
      prompts: [
        "What thoughts about yourself appear most often?",
        "Which thoughts help you move forward, and which hold you back?"
      ]
    },
    {
      title: "Lesson 1.2 - Your Self-Concept: The Internal Thermostat",
      duration: 10,
      text: [
        "Self-concept is the mental image you have of yourself. It includes your beliefs about your abilities, intelligence, personality, and potential.",
        "This internal picture acts like a thermostat controlling how far you allow yourself to grow. If you believe you are capable and worthy, you will pursue opportunities confidently. If you believe you are limited or inadequate, you may unconsciously avoid opportunities.",
        "Two people can have the same ability. One believes they can succeed, while the other doubts themselves. The student with stronger belief will usually perform better because their mind supports their actions.",
        "Improving confidence begins with improving your self-image. You do this by becoming aware of the story you tell yourself and choosing a better story."
      ].join("\n\n"),
      prompts: [
        "Write three positive qualities that describe who you are.",
        "What is one belief about yourself you want to upgrade?"
      ]
    },
    {
      title: "Lesson 1.3 - Brain Chemistry and Confidence",
      duration: 10,
      text: [
        "Confidence is not only psychological. It has biological components too. When you feel confident, your brain releases chemicals such as dopamine, serotonin, and endorphins.",
        "Dopamine supports motivation and reward. Serotonin supports mood and stability. Endorphins support positive emotional states.",
        "Your brain responds to the signals you send through your thoughts and actions. When you practice positive thinking, take action toward goals, and celebrate progress, your brain reinforces those behaviors by releasing chemicals that support confidence.",
        "This creates a self-reinforcing cycle: positive action produces positive chemistry, which makes future action easier."
      ].join("\n\n"),
      prompts: [
        "What activities make you feel energized or motivated?",
        "How can you reward yourself for progress, even small progress?"
      ]
    },
    {
      title: "Lesson 1.4 - The Power of Repeated Beliefs",
      duration: 10,
      text: [
        "The brain forms neural pathways based on repeated thoughts and behaviors. Every time you repeat a belief, the pathway becomes stronger. Over time, these patterns become automatic.",
        "If someone constantly repeats thoughts such as, 'I am not good enough' or 'I always fail', the brain strengthens those negative pathways.",
        "However, the brain can also build positive pathways. By repeating empowering beliefs like 'I am capable of learning' or 'I grow through challenges', you train your brain to expect success and progress.",
        "Confidence becomes natural when positive beliefs are repeated consistently."
      ].join("\n\n"),
      prompts: [
        "List one negative belief you want to replace.",
        "Write two empowering beliefs you can repeat daily."
      ]
    },
    {
      title: "Lesson 1.5 - Thought and Identity",
      duration: 10,
      text: [
        "Proverbs 23:7 says, 'As a man thinketh in his heart, so is he.' This statement reflects a powerful psychological truth. The thoughts we consistently hold eventually shape our identity and actions.",
        "If a person constantly believes they are weak, they will behave as if they are weak. If a person believes they are capable and resilient, they will approach life with courage.",
        "Your identity is influenced by your thoughts. Therefore, guarding your thoughts and directing them toward growth is one of the most important steps in developing confidence.",
        "You are not your temporary feelings. You are the person you repeatedly choose to become."
      ].join("\n\n"),
      prompts: [
        "Write one belief about yourself that you want to strengthen.",
        "What would change if you consistently believed that statement?"
      ]
    },
    {
      title: "Lesson 1.6 - Module 1 Quiz",
      duration: 6,
      text: [
        "Answer these questions to test your understanding of Module 1.",
        "1. What is self-concept?",
        "2. How do repeated thoughts influence the brain?",
        "3. Which brain chemicals support confidence?",
        "4. Why do beliefs influence performance?",
        "5. What does Proverbs 23:7 teach about thoughts?"
      ].join("\n\n"),
      prompts: [
        "Which question was easiest for you?",
        "Which concept needs more review?"
      ]
    }
  ],
  module2: [
    {
      title: "Lesson 2.1 - Understanding Self-Doubt",
      duration: 9,
      text: [
        "Self-doubt develops from many experiences, including criticism, failure, comparison, and fear of judgment.",
        "When the mind remembers painful experiences, it sometimes tries to protect us by discouraging risk. That protection feels safe, but it also prevents growth.",
        "Recognizing the source of self-doubt is the first step in overcoming it. When you can name it, you can challenge it.",
        "Instead of asking, 'What if I fail?' ask, 'What if I learn something important?'"
      ].join("\n\n"),
      prompts: [
        "What is a common source of your self-doubt?",
        "How has avoiding risk limited your growth?"
      ]
    },
    {
      title: "Lesson 2.2 - The Comparison Trap",
      duration: 9,
      text: [
        "Comparing yourself to others can weaken confidence. Every person has a unique path, different experiences, and different strengths.",
        "When you constantly measure yourself against others, you focus on what you lack instead of what you have achieved.",
        "Confidence grows when you measure progress against your own past self rather than against other people.",
        "Your journey is yours. Compete with yesterday, not with someone else."
      ].join("\n\n"),
      prompts: [
        "Who do you tend to compare yourself with?",
        "What progress have you made in the last six months?"
      ]
    },
    {
      title: "Lesson 2.3 - Rewriting Your Inner Dialogue",
      duration: 9,
      text: [
        "Everyone has an internal voice that comments on their actions. For many people, this voice becomes overly critical.",
        "Instead of saying, 'I cannot do this,' practice saying, 'I am learning how to do this.'",
        "This small change shifts the mind from limitation to growth. Your language shapes your belief, and your belief shapes your behavior.",
        "When you correct your inner dialogue, you train your mind to support you instead of sabotage you."
      ].join("\n\n"),
      prompts: [
        "Write one critical sentence your inner voice says.",
        "Rewrite it into a growth-focused sentence."
      ]
    },
    {
      title: "Lesson 2.4 - The Victory Journal",
      duration: 9,
      text: [
        "One powerful tool for building confidence is the Victory Journal. It trains your brain to recognize progress rather than focus on mistakes.",
        "Each day, write three things you did well, one lesson you learned, and one thing you will improve tomorrow.",
        "This practice strengthens self-awareness and creates a record of growth. Over time, your journal becomes evidence that you are making progress.",
        "Confidence grows when you can clearly see your small wins."
      ].join("\n\n"),
      prompts: [
        "Start your Victory Journal today and write your first entry.",
        "How did it feel to focus on your wins?"
      ]
    },
    {
      title: "Lesson 2.5 - Failure as Feedback",
      duration: 9,
      text: [
        "Many people see failure as proof of weakness. However, failure is simply information that helps refine your approach.",
        "Every mistake provides data about what works and what does not. Confident individuals use failure as a learning tool rather than a reason to stop trying.",
        "When you treat failure as feedback, you become resilient. You stay in the game long enough to grow.",
        "The question is not, 'Did I fail?' The question is, 'What did I learn and how will I adjust?'"
      ].join("\n\n"),
      prompts: [
        "Describe a recent failure and what it taught you.",
        "What is one adjustment you will make next time?"
      ]
    }
  ],
  module3: [
    {
      title: "Lesson 3.1 - Understanding Courage",
      duration: 9,
      text: [
        "Courage is not the absence of fear. Fear is a natural human emotion.",
        "Courage is the decision to act even when fear is present. Every time you act despite fear, your mind becomes stronger.",
        "Courage is a muscle. It grows when you use it. When you avoid action, it weakens.",
        "You do not need to feel ready to be courageous. You just need to move."
      ].join("\n\n"),
      prompts: [
        "What action are you avoiding because of fear?",
        "What is one small courageous step you can take today?"
      ]
    },
    {
      title: "Lesson 3.2 - Small Risks Build Confidence",
      duration: 9,
      text: [
        "Confidence does not require dramatic actions. Small risks such as speaking up in a group, sharing ideas, or trying something new gradually expand your comfort zone.",
        "Each small success strengthens belief in your abilities. When you win small, you feel safe to try bigger.",
        "This is how confidence grows in real life. Step by step, risk by risk.",
        "Do not underestimate the power of small courageous choices."
      ].join("\n\n"),
      prompts: [
        "List three small risks you can take this week.",
        "Which one feels most doable right now?"
      ]
    },
    {
      title: "Lesson 3.3 - Action Creates Confidence",
      duration: 9,
      text: [
        "Many people wait until they feel confident before taking action. In reality, confidence is built after action.",
        "When you act, you gain experience. Experience strengthens belief. Over time, your mind concludes, 'I can do this.'",
        "If you wait for confidence, you delay growth. If you act, confidence follows.",
        "Confidence is the reward of movement."
      ].join("\n\n"),
      prompts: [
        "What action have you been delaying because you do not feel ready?",
        "What is one step you can take today?"
      ]
    },
    {
      title: "Lesson 3.4 - Building Momentum",
      duration: 9,
      text: [
        "Repeated actions create momentum. Once momentum develops, tasks that once seemed difficult become easier.",
        "Momentum reduces resistance. It creates a sense of flow that keeps you moving.",
        "Confidence becomes a habit when positive actions are repeated regularly.",
        "Focus on consistency, not intensity. Consistency builds momentum."
      ].join("\n\n"),
      prompts: [
        "Where in your life do you need more momentum?",
        "What daily habit could help you build it?"
      ]
    },
    {
      title: "Lesson 3.5 - Faith and Action",
      duration: 9,
      text: [
        "James 2:17 teaches, 'Faith without works is dead.' Belief must be combined with action.",
        "Confidence grows when faith in your potential is expressed through consistent effort.",
        "Faith gives courage, and action gives evidence. Together they build a strong inner foundation.",
        "You do not need perfect faith. You need active faith."
      ].join("\n\n"),
      prompts: [
        "Where can you express your faith through action this week?",
        "What is one action that proves you believe in your potential?"
      ]
    }
  ],
  module4: [
    {
      title: "Lesson 4.1 - Resilience",
      duration: 9,
      text: [
        "Resilience is the ability to recover after setbacks. Every challenge provides an opportunity to strengthen character and wisdom.",
        "Resilient people do not avoid pain. They learn from it and rise again.",
        "Confidence grows when you know you can bounce back. That knowledge reduces fear of failure.",
        "Resilience is built by facing difficulty with courage and learning."
      ].join("\n\n"),
      prompts: [
        "Describe a challenge you overcame in the past.",
        "What did that experience teach you about your strength?"
      ]
    },
    {
      title: "Lesson 4.2 - Affirmations and Identity",
      duration: 9,
      text: [
        "Affirmations are statements that reinforce positive identity. Examples include: 'I am capable,' 'I am growing,' 'I am resilient.'",
        "Repeated affirmations help reshape self-perception. They are not magic words, but they train your mind to focus on strength.",
        "When you speak life over yourself, you create internal support instead of internal sabotage.",
        "Choose affirmations that feel true and aligned with your growth."
      ].join("\n\n"),
      prompts: [
        "Write three affirmations you will repeat daily.",
        "How will you remind yourself to practice them?"
      ]
    },
    {
      title: "Lesson 4.3 - Environment and Influence",
      duration: 9,
      text: [
        "The people around you influence your mindset. Supportive environments encourage growth, while negative environments may weaken confidence.",
        "You are not responsible for everyone, but you are responsible for what you allow to shape your thinking.",
        "Choosing positive influences strengthens inner belief. This may include friends, mentors, communities, and learning resources.",
        "Confidence grows faster in an environment that expects growth."
      ].join("\n\n"),
      prompts: [
        "Who in your life strengthens your confidence?",
        "What environment or influence do you need to reduce?"
      ]
    },
    {
      title: "Lesson 4.4 - Protecting Your Mind",
      duration: 9,
      text: [
        "Information you consume affects your thinking. Be mindful of negative content that reinforces fear or doubt.",
        "Choose books, conversations, and media that encourage growth. This is not about avoiding reality, it is about feeding your mind with strength.",
        "When you protect your mind, you protect your confidence.",
        "Your attention is a limited resource. Spend it wisely."
      ].join("\n\n"),
      prompts: [
        "What content drains your confidence?",
        "What content or habits could you replace it with?"
      ]
    },
    {
      title: "Lesson 4.5 - Quiet Confidence",
      duration: 9,
      text: [
        "True confidence does not require attention or validation. It is calm, grounded, and secure.",
        "Quiet confidence comes from knowing your value and trusting your abilities.",
        "You do not need to prove yourself to everyone. You need to stay faithful to your growth.",
        "Confidence becomes stronger when it is rooted in inner peace rather than external praise."
      ].join("\n\n"),
      prompts: [
        "Where do you seek external validation most?",
        "What would it look like to trust yourself more?"
      ]
    }
  ],
  module5: [
    {
      title: "Lesson 5.1 - Living Without Fear of Judgment",
      duration: 9,
      text: [
        "Fear of judgment prevents many people from expressing their true potential. Confidence allows individuals to pursue goals without excessive concern about others' opinions.",
        "Most people are focused on their own lives. Your job is to follow your purpose, not to manage every opinion.",
        "Freedom grows when you choose values over approval.",
        "Practice acting from your values, even when you feel exposed."
      ].join("\n\n"),
      prompts: [
        "Where does fear of judgment show up in your life?",
        "What action would you take if you were not afraid of opinions?"
      ]
    },
    {
      title: "Lesson 5.2 - Reframing Challenges",
      duration: 9,
      text: [
        "Every challenge can be seen as either a problem or an opportunity. Changing perspective helps transform difficulties into growth experiences.",
        "When you reframe a challenge, you shift from fear to curiosity.",
        "Ask, 'What is this teaching me?' and 'How can this make me stronger?'",
        "Confidence increases when you see obstacles as training."
      ].join("\n\n"),
      prompts: [
        "What challenge are you facing right now?",
        "How could this challenge serve your growth?"
      ]
    },
    {
      title: "Lesson 5.3 - Remembering Past Victories",
      duration: 9,
      text: [
        "Reflecting on past successes strengthens belief in your abilities. Your history contains evidence of resilience and strength.",
        "When you remember what you have overcome, your fear loses power.",
        "Make a list of victories you tend to forget. Celebrate them.",
        "Confidence grows when you see proof of your strength."
      ].join("\n\n"),
      prompts: [
        "List five victories from your past.",
        "Which victory reminds you of your resilience?"
      ]
    },
    {
      title: "Lesson 5.4 - Progress Over Perfection",
      duration: 9,
      text: [
        "Perfectionism prevents action. Focusing on progress allows continuous growth and learning.",
        "Progress means movement, not flawlessness. When you focus on progress, you reduce fear and increase momentum.",
        "Give yourself permission to be a beginner. Growth is a process.",
        "Confidence grows when you honor progress."
      ].join("\n\n"),
      prompts: [
        "Where has perfectionism slowed you down?",
        "What would progress look like this week?"
      ]
    },
    {
      title: "Lesson 5.5 - Strength Through Faith",
      duration: 9,
      text: [
        "Philippians 4:13 says, 'I can do all things through Christ who strengthens me.' Faith provides strength beyond personal limitations and encourages perseverance.",
        "Confidence grows when you remember your source of strength. You are not alone in your journey.",
        "Faith gives you the courage to attempt what seems too big for you.",
        "Let faith expand your vision of what is possible."
      ].join("\n\n"),
      prompts: [
        "How does faith strengthen your confidence?",
        "What is one bold action you can take with faith today?"
      ]
    }
  ],
  module6: [
    {
      title: "Lesson 6.1 - Final Reflection: The Confidence Code Going Forward",
      duration: 8,
      text: [
        "Confidence is cultivated daily through awareness, action, and faith. Throughout this course you have explored your thoughts, faced doubts, and developed tools for growth.",
        "Now it is time to reflect and commit to your next steps. Growth does not end with this course. It continues through your daily choices.",
        "Take time to review your notes, re-read your exercises, and identify the habits that helped you most.",
        "Your confidence will grow as you continue to apply what you have learned."
      ].join("\n\n"),
      prompts: [
        "What new belief about yourself have you developed?",
        "What action will you take to continue building confidence?",
        "How will you maintain these habits moving forward?"
      ]
    }
  ]
};

function buildReadingBlock(text, prompts) {
  const promptText = prompts && prompts.length
    ? `\n\nReflection:\n- ${prompts.join("\n- ")}`
    : "";
  return `${text}${promptText}`;
}

function moduleKeyForTitle(title) {
  const t = title.toLowerCase();
  if (t.includes("introduction")) return "introduction";
  if (t.includes("psychology")) return "module1";
  if (t.includes("self-doubt")) return "module2";
  if (t.includes("bold action")) return "module3";
  if (t.includes("inner strength")) return "module4";
  if (t.includes("confidence code in action")) return "module5";
  if (t.includes("final reflection")) return "module6";
  return null;
}

async function main() {
  const courseQ = await pool.query(
    "SELECT id, title FROM courses WHERE title = $1 LIMIT 1",
    [COURSE_TITLE]
  );
  const course = courseQ.rows[0];
  if (!course) {
    throw new Error(`Course not found: ${COURSE_TITLE}`);
  }

  const modulesQ = await pool.query(
    "SELECT id, title, order_index FROM modules WHERE course_id = $1 ORDER BY order_index",
    [course.id]
  );
  if (!modulesQ.rows.length) {
    throw new Error("No modules found for course. Expected existing modules 1-6.");
  }

  const existingIntro = modulesQ.rows.find((m) => m.title === INTRO_MODULE_TITLE);
  if (!existingIntro) {
    await pool.query(
      "UPDATE modules SET order_index = order_index + 1 WHERE course_id = $1",
      [course.id]
    );
    await pool.query(
      "INSERT INTO modules (course_id, title, order_index) VALUES ($1, $2, $3)",
      [course.id, INTRO_MODULE_TITLE, 0]
    );
  }

  const refreshedModulesQ = await pool.query(
    "SELECT id, title, order_index FROM modules WHERE course_id = $1 ORDER BY order_index",
    [course.id]
  );

  // Verify no lessons exist yet
  const lessonCountQ = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM lessons l
     JOIN modules m ON l.module_id = m.id
     WHERE m.course_id = $1`,
    [course.id]
  );
  if (lessonCountQ.rows[0].count > 0) {
    throw new Error("Lessons already exist for this course. Aborting to avoid duplicates.");
  }

  for (const mod of refreshedModulesQ.rows) {
    const key = moduleKeyForTitle(mod.title);
    if (!key) continue;
    const lessons = lessonsByModule[key] || [];
    let orderIndex = 0;
    for (const lesson of lessons) {
      const lessonInsert = await pool.query(
        `INSERT INTO lessons (module_id, title, content_type, order_index, duration_minutes, is_free_preview)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [mod.id, lesson.title, "video", orderIndex, lesson.duration, false]
      );
      const lessonId = lessonInsert.rows[0].id;

      await pool.query(
        `INSERT INTO lesson_content (lesson_id, content_type, title, body, order_index)
         VALUES ($1, $2, $3, $4, $5)`,
        [lessonId, "video", "Video", null, 0]
      );

      const reading = buildReadingBlock(lesson.text, lesson.prompts);
      await pool.query(
        `INSERT INTO lesson_content (lesson_id, content_type, title, body, order_index)
         VALUES ($1, $2, $3, $4, $5)`,
        [lessonId, "text", "Reading", reading, 1]
      );

      orderIndex += 1;
    }
  }

  console.log("Course build complete.");
}

main()
  .catch((err) => {
    console.error("Course build failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

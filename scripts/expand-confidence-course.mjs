import { pool } from "../src/config/postgres.js";

const COURSE_ID = 3;

function hashString(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) % 1000000;
  }
  return hash;
}

function pickTemplate(list, seed, offset = 0) {
  if (!list.length) return "";
  return list[(seed + offset) % list.length];
}

function buildLessonText(data) {
  const {
    title,
    theme,
    keyIdeas,
    obstacles,
    practiceSteps,
    reflectionQuestions,
    scripture,
    affirmation
  } = data;

  const [k1, k2, k3, k4, k5] = keyIdeas;
  const [o1, o2, o3] = obstacles;
  const seed = hashString(title);

  const overviewTemplates = [
    `Lesson Overview\nThis lesson centers on ${theme}. You will learn what builds confidence in real life and how to strengthen it through clear, repeatable actions. The goal is not hype; it is stable belief grounded in evidence and practice.`,
    `Lesson Overview\nIn this lesson you will explore ${theme}. Expect practical insight, not theory only. The focus is on creating internal stability so your choices stay strong even when emotions fluctuate.`,
    `Lesson Overview\nThis session focuses on ${theme}. You will see how small, consistent choices reshape self-belief and help you move forward with calm determination.`
  ];

  const outcomesTemplates = [
    `Lesson Outcomes\nBy the end of this lesson you will be able to describe the core idea clearly, identify one obstacle that blocks growth, and apply a focused practice that builds confidence.`,
    `Lesson Outcomes\nAfter completing this lesson you will be able to explain the main concept, spot unhelpful patterns, and follow a simple plan to strengthen self-belief.`,
    `Lesson Outcomes\nYou will leave this lesson with a clear definition, one practical tool, and a short action plan you can apply immediately.`
  ];

  const definitionTemplates = [
    `Definition\nConfidence is steady trust in your ability to learn, adapt, and act with purpose. It does not remove fear; it reduces the power of fear by grounding you in truth and action.`,
    `Definition\nConfidence is the inner certainty that growth is possible and that you can take the next step even when it feels uncomfortable.`,
    `Definition\nConfidence is not loudness or perfection. It is the quiet conviction that you can respond well and keep moving forward.`
  ];

  const howItWorksTemplates = [
    `How It Works\nConfidence grows when the mind and body receive consistent signals that you can handle life. The first signal is ${k1}. When you practice ${k1}, your brain predicts success instead of danger. The second signal is ${k2}, which keeps you moving rather than freezing. Over time, your nervous system relaxes and your attention widens.`,
    `How It Works\nYour brain builds confidence from evidence. ${k1} supplies that evidence, and ${k2} keeps the evidence coming. With repetition, your body learns that forward action is safe and your thinking becomes clearer.`,
    `How It Works\nYou train confidence the same way you train a muscle: small reps repeated over time. ${k1} starts the training and ${k2} locks it in. That is how belief becomes stable.`
  ];

  const deepeningTemplates = [
    `Deepening the Idea\n${k3} matters because it anchors identity. ${k4} strengthens that anchor by shaping attention, and ${k5} becomes the result of repeated, aligned action. This is why confident people look calm: their internal patterns are consistent.`,
    `Deepening the Idea\nWhen you practice ${k3}, you stop letting emotions decide your direction. ${k4} teaches your mind to focus on what matters, and ${k5} grows as you repeat those choices.`,
    `Deepening the Idea\n${k3} gives you stability. ${k4} gives you focus. ${k5} gives you resilience. Together they build a confidence that lasts beyond a single good day.`
  ];

  const obstaclesTemplates = [
    `Common Obstacles\nMost people struggle with ${o1}, ${o2}, and ${o3}. These are normal, but they are not permanent. The goal is not to remove fear; it is to keep fear from making the decision.`,
    `Common Obstacles\n${o1}, ${o2}, and ${o3} are the usual roadblocks. Expect them, but do not obey them. When they show up, slow down and use the tools in this lesson.`,
    `Common Obstacles\nThe biggest blockers here are ${o1}, ${o2}, and ${o3}. Name them early, then respond with disciplined action instead of hesitation.`
  ];

  const exampleTemplates = [
    `Real Life Example\nImagine a student who wants to speak in a meeting but feels nervous. If they wait to feel ready, they stay silent. If they apply this lesson, they take one small step and speak. That action becomes evidence, and evidence grows confidence.`,
    `Real Life Example\nPicture someone who keeps delaying a hard conversation. They practice ${k1} and take a small step. The result is not perfect, but it proves they can act, and that proof grows belief.`,
    `Real Life Example\nA learner starts a new habit and feels unsure. They apply ${k2} and track small wins for a week. The wins become a record of progress and the doubt begins to shrink.`
  ];

  const planTemplates = [
    `Practice Plan\nChoose one area of life where you want stronger confidence. Use the steps below for seven days. Track your actions, not your emotions. At the end of the week, review your notes and celebrate consistency.`,
    `Practice Plan\nKeep this simple. Choose one focus area and follow the steps for a week. The goal is not intensity; the goal is repetition and proof.`,
    `Practice Plan\nPick one small arena, follow the steps below, and record your results daily. Your confidence will grow as your evidence grows.`
  ];

  const reflectionTemplates = [
    `Reflection and Faith\nReflection turns experience into wisdom. Ask God for clarity, strength, and discipline. Faith does not replace action; it sustains action. Notice where fear tried to control you and where faith helped you move anyway.`,
    `Reflection and Faith\nSlow down and reflect. What did you learn about yourself? If you use faith, bring it into your reflection and ask for the courage to keep going.`,
    `Reflection and Faith\nPrayer and reflection keep your actions aligned. Let faith supply endurance while practice supplies proof.`
  ];

  const commitmentTemplates = [
    `Commitment\nConfidence grows through commitment, not perfection. Keep returning to the process. Finish this lesson by choosing one step you will take today.`,
    `Commitment\nYou do not need perfect days; you need consistent days. Commit to one action and follow through.`,
    `Commitment\nMake one clear decision now: what will you do today that proves your growth?`
  ];

  const coachingTemplates = [
    `Coaching Questions\nIf you had a coach beside you, they would ask: What is one decision you are avoiding? What would your life look like if you consistently made the courageous decision? What is the smallest version of that decision you can make today? Use these questions to turn insight into movement.`,
    `Coaching Questions\nA coach would ask: What are you delaying? What would change if you acted anyway? What is the smallest step you can take today?`
  ];

  const weeklyTemplates = [
    `Weekly Challenge\nCommit to a simple seven-day challenge that fits this lesson. Each day, take one action that supports your confidence. Record the action and the result. Evidence creates belief.`,
    `Weekly Challenge\nFor one week, take one small action daily. Track it. That record becomes proof that you can move.`,
    `Weekly Challenge\nChoose a daily action and keep it for seven days. Review your record at the end of the week.`
  ];

  const mistakesTemplates = [
    `Common Mistakes and Fixes\nOne mistake is trying to change everything at once. Another mistake is expecting instant feelings of confidence. A third mistake is judging yourself for feeling fear. The fix is to return to the process: small action, honest reflection, and consistent practice.`,
    `Common Mistakes and Fixes\nPeople often overreach, quit too quickly, or wait for perfect feelings. The fix is simple: do the next small step and track it.`,
    `Common Mistakes and Fixes\nAvoid these traps: doing too much at once, waiting for motivation, and skipping reflection. The correction is steady practice.`
  ];

  const applicationTemplates = [
    `Application Prompt\nPick one area of life where you want greater confidence and write a two-sentence plan: what you will do today and how you will record it. Set a reminder for tomorrow so you repeat the action.`,
    `Application Prompt\nWrite a brief plan for today: one action and one way to record it. Then repeat tomorrow.`,
    `Application Prompt\nDecide on one action, do it today, and record the result. Repetition is how belief grows.`
  ];

  const paragraphs = [];

  paragraphs.push(pickTemplate(overviewTemplates, seed));
  paragraphs.push(pickTemplate(outcomesTemplates, seed, 1));
  paragraphs.push(pickTemplate(definitionTemplates, seed, 2));
  paragraphs.push(pickTemplate(howItWorksTemplates, seed, 3));
  paragraphs.push(pickTemplate(deepeningTemplates, seed, 4));
  paragraphs.push(pickTemplate(obstaclesTemplates, seed, 5));
  paragraphs.push(pickTemplate(exampleTemplates, seed, 6));
  paragraphs.push(pickTemplate(planTemplates, seed, 7));
  paragraphs.push(pickTemplate(reflectionTemplates, seed, 8));
  paragraphs.push(pickTemplate(commitmentTemplates, seed, 9));
  paragraphs.push(pickTemplate(coachingTemplates, seed, 10));
  paragraphs.push(pickTemplate(weeklyTemplates, seed, 11));
  paragraphs.push(pickTemplate(mistakesTemplates, seed, 12));
  paragraphs.push(pickTemplate(applicationTemplates, seed, 13));

  if (scripture) {
    paragraphs.push(`Scripture Focus\n${scripture}`);
  }

  paragraphs.push("Practice Steps:\n- " + practiceSteps.join("\n- "));
  paragraphs.push("Reflection Questions:\n- " + reflectionQuestions.join("\n- "));
  paragraphs.push("Weekly Challenge Checklist:\n- Choose one specific action for each day.\n- Keep actions small enough to complete.\n- Track the action and result.\n- Speak the affirmation after each action.\n- Review the week and celebrate consistency.");
  paragraphs.push("Common Mistakes:\n- Trying to change everything at once.\n- Waiting to feel confident before acting.\n- Avoiding reflection after action.");
  paragraphs.push(`Affirmation\n${affirmation}`);

  return paragraphs.join("\n\n");
}

const lessons = [
  {
    title: "Lesson 0.1 - Welcome to the Confidence Code",
    theme: "building a clear starting point and a growth mindset for the course",
    keyIdeas: [
      "setting intention",
      "consistent practice",
      "self-honesty",
      "small wins",
      "steady progress"
    ],
    obstacles: [
      "waiting to feel ready",
      "judging yourself too harshly",
      "quitting early"
    ],
    practiceSteps: [
      "Write why you want more confidence and keep it visible.",
      "Pick one area of life to focus on this week.",
      "Take one small action today that supports that goal.",
      "Record the action and how it made you feel.",
      "Repeat for seven days and review your progress."
    ],
    reflectionQuestions: [
      "Why did you enroll in this course?",
      "Where in your life do you want stronger confidence?",
      "What would change if you trusted yourself more?"
    ],
    scripture: "Proverbs 4:23 - Guard your heart, for everything you do flows from it.",
    affirmation: "I am willing to grow, and I will build confidence through daily action."
  },
  {
    title: "Lesson 0.2 - What Confidence Really Means",
    theme: "understanding confidence as action in the presence of fear",
    keyIdeas: [
      "courage with fear",
      "learnable skill",
      "adaptability",
      "accepting mistakes",
      "staying committed"
    ],
    obstacles: [
      "believing confidence means perfection",
      "avoiding challenges",
      "letting doubt define identity"
    ],
    practiceSteps: [
      "Define confidence in your own words.",
      "List one fear that has been holding you back.",
      "Take one small action that faces that fear.",
      "Note what you learned and what surprised you.",
      "Repeat with another small action tomorrow."
    ],
    reflectionQuestions: [
      "When did you last act despite fear?",
      "What mistake taught you the most this year?",
      "How could you interpret fear as a signal to grow?"
    ],
    scripture: "Joshua 1:9 - Be strong and courageous; do not be afraid.",
    affirmation: "I move forward even when I feel fear, and I learn from every step."
  },
  {
    title: "Lesson 1.1 - How Confidence Begins in the Mind",
    theme: "the mental foundation of confidence and thought patterns",
    keyIdeas: [
      "beliefs shape behavior",
      "mental rehearsal",
      "attention training",
      "reframing thoughts",
      "choosing empowering narratives"
    ],
    obstacles: [
      "negative self-talk",
      "overthinking",
      "avoiding new experiences"
    ],
    practiceSteps: [
      "Notice your most common self-statements today.",
      "Rewrite one negative statement into a growth statement.",
      "Repeat the growth statement three times daily.",
      "Take one action that aligns with the new belief.",
      "Track the outcome and how your mind responded."
    ],
    reflectionQuestions: [
      "Which thought pattern shows up most often?",
      "How does that pattern influence your choices?",
      "What new belief would serve you better?"
    ],
    scripture: "Romans 12:2 - Be transformed by the renewing of your mind.",
    affirmation: "My thoughts are training grounds, and I choose thoughts that build me."
  },
  {
    title: "Lesson 1.2 - Your Self-Concept: The Internal Thermostat",
    theme: "how identity beliefs set your limits and how to raise them",
    keyIdeas: [
      "self-image",
      "identity-based action",
      "internal limits",
      "worthy and capable",
      "growth identity"
    ],
    obstacles: [
      "clinging to old labels",
      "fear of success",
      "avoiding opportunities"
    ],
    practiceSteps: [
      "Write three positive qualities you already show.",
      "Identify one limiting label you carry.",
      "Replace it with a growth label you will adopt.",
      "Act once today as if the new label is true.",
      "Write down evidence that supports the new identity."
    ],
    reflectionQuestions: [
      "What labels did you absorb from others?",
      "Which identity do you want to strengthen?",
      "What behavior would prove that identity today?"
    ],
    scripture: "2 Corinthians 5:17 - If anyone is in Christ, the new creation has come.",
    affirmation: "My self-concept is rising, and I act from my true worth."
  },
  {
    title: "Lesson 1.3 - Brain Chemistry and Confidence",
    theme: "how dopamine, serotonin, and endorphins support confident action",
    keyIdeas: [
      "dopamine and motivation",
      "serotonin and stability",
      "endorphins and resilience",
      "rewarding progress",
      "creating positive loops"
    ],
    obstacles: [
      "chasing perfection instead of progress",
      "ignoring small wins",
      "overworking without recovery"
    ],
    practiceSteps: [
      "Choose a small goal you can complete today.",
      "Celebrate completion with a healthy reward.",
      "Notice how your body feels after progress.",
      "Add a short recovery habit (walk, stretch, prayer).",
      "Repeat daily to build a positive loop."
    ],
    reflectionQuestions: [
      "What type of progress energizes you most?",
      "How do you celebrate wins right now?",
      "What recovery habit would support your confidence?"
    ],
    scripture: "Proverbs 17:22 - A cheerful heart is good medicine.",
    affirmation: "I honor progress, and my brain supports my growth."
  },
  {
    title: "Lesson 1.4 - The Power of Repeated Beliefs",
    theme: "neural pathways and the power of repetition",
    keyIdeas: [
      "repetition shapes pathways",
      "automatic thoughts",
      "intentional rehearsal",
      "belief consistency",
      "identity reinforcement"
    ],
    obstacles: [
      "repeating negative narratives",
      "inconsistent practice",
      "expecting instant change"
    ],
    practiceSteps: [
      "Identify one belief you want to strengthen.",
      "Write a daily statement that expresses it.",
      "Speak it morning and evening for 14 days.",
      "Pair it with one small action daily.",
      "Track changes in your response to challenges."
    ],
    reflectionQuestions: [
      "Which belief do you repeat most often?",
      "How has that belief shaped your behavior?",
      "What belief do you want to repeat instead?"
    ],
    scripture: "Galatians 6:9 - Let us not become weary in doing good.",
    affirmation: "I repeat beliefs that align with my growth and future."
  },
  {
    title: "Lesson 1.5 - Thought and Identity",
    theme: "how thoughts shape identity and behavior",
    keyIdeas: [
      "thoughts create identity",
      "internal agreement",
      "self-fulfilling patterns",
      "mental discipline",
      "intentional focus"
    ],
    obstacles: [
      "believing every thought",
      "negative identity scripts",
      "mindless media intake"
    ],
    practiceSteps: [
      "Write one thought you want to strengthen.",
      "Write one thought you want to weaken.",
      "Limit one source of negative input today.",
      "Practice one replacement thought in prayer or journaling.",
      "Choose one action that matches the new thought."
    ],
    reflectionQuestions: [
      "Which thought most shapes your identity?",
      "What would change if that thought was upgraded?",
      "How will you guard your mind this week?"
    ],
    scripture: "Proverbs 23:7 - As a man thinks in his heart, so is he.",
    affirmation: "My thoughts align with the person I am becoming."
  },
  {
    title: "Lesson 1.6 - Module 1 Quiz",
    theme: "reviewing and reinforcing the psychology of confidence",
    keyIdeas: [
      "self-concept",
      "repetition and pathways",
      "brain chemistry",
      "belief-driven action",
      "identity and thought"
    ],
    obstacles: [
      "rushing past review",
      "forgetting key concepts",
      "not applying the ideas"
    ],
    practiceSteps: [
      "Answer each quiz question without notes first.",
      "Review the lesson that felt hardest.",
      "Write one sentence per concept in your own words.",
      "Explain a concept to a friend or in a journal.",
      "Choose one idea to apply today."
    ],
    reflectionQuestions: [
      "Which concept is strongest in your understanding?",
      "Which concept needs reinforcement?",
      "How will you practice it this week?"
    ],
    scripture: "James 1:22 - Do not merely listen to the word, and so deceive yourselves. Do what it says.",
    affirmation: "I review, apply, and grow stronger with every lesson."
  },
  {
    title: "Lesson 2.1 - Understanding Self-Doubt",
    theme: "the origins of self-doubt and how to interrupt it",
    keyIdeas: [
      "protective fear",
      "past criticism",
      "learned hesitation",
      "naming the doubt",
      "choosing a new response"
    ],
    obstacles: [
      "confusing caution with truth",
      "reliving past failures",
      "avoiding responsibility"
    ],
    practiceSteps: [
      "Name your most frequent doubt aloud.",
      "Identify where it came from.",
      "Write a realistic counter-statement.",
      "Act on the counter-statement once today.",
      "Record the outcome in your journal."
    ],
    reflectionQuestions: [
      "What is the root of your self-doubt?",
      "How has it protected you, and how has it limited you?",
      "What new response will you practice?"
    ],
    scripture: "2 Timothy 1:7 - God has not given us a spirit of fear.",
    affirmation: "I acknowledge doubt, and I choose courage anyway."
  },
  {
    title: "Lesson 2.2 - The Comparison Trap",
    theme: "breaking unhealthy comparison and building self-referenced growth",
    keyIdeas: [
      "unique path",
      "personal progress",
      "gratitude",
      "focus on controllables",
      "measure growth by action"
    ],
    obstacles: [
      "social media pressure",
      "envy and insecurity",
      "discounting your own wins"
    ],
    practiceSteps: [
      "List three ways you have grown in the last year.",
      "Unfollow one account that fuels comparison.",
      "Set one personal metric for progress this week.",
      "Celebrate one small win daily.",
      "Replace comparison with a gratitude statement."
    ],
    reflectionQuestions: [
      "Who triggers comparison most often?",
      "What progress are you ignoring?",
      "How can you measure growth by your own values?"
    ],
    scripture: "Galatians 6:4 - Each one should test their own actions.",
    affirmation: "I honor my path and measure growth by my progress."
  },
  {
    title: "Lesson 2.3 - Rewriting Your Inner Dialogue",
    theme: "transforming self-talk from critical to constructive",
    keyIdeas: [
      "inner voice awareness",
      "language shapes belief",
      "growth statements",
      "compassionate correction",
      "daily rehearsal"
    ],
    obstacles: [
      "automatic criticism",
      "perfectionism",
      "all-or-nothing thinking"
    ],
    practiceSteps: [
      "Write your most common critical phrase.",
      "Rewrite it into a growth-focused sentence.",
      "Repeat the new sentence during a challenge.",
      "Pair it with a small action.",
      "End the day with a short self-encouragement."
    ],
    reflectionQuestions: [
      "What tone does your inner voice use?",
      "How does that tone affect your courage?",
      "What would a supportive inner voice say?"
    ],
    scripture: "Ephesians 4:29 - Speak what is helpful for building others up.",
    affirmation: "My inner voice strengthens me and guides me forward."
  },
  {
    title: "Lesson 2.4 - The Victory Journal",
    theme: "building confidence through daily evidence of progress",
    keyIdeas: [
      "daily wins",
      "learning mindset",
      "intentional review",
      "evidence tracking",
      "positive focus"
    ],
    obstacles: [
      "ignoring small progress",
      "focusing only on mistakes",
      "inconsistent journaling"
    ],
    practiceSteps: [
      "Write three things you did well today.",
      "Write one lesson you learned.",
      "Write one improvement for tomorrow.",
      "Review the journal weekly for patterns.",
      "Celebrate the progress you see."
    ],
    reflectionQuestions: [
      "What type of wins appear most often?",
      "What lesson do you keep learning?",
      "How does reviewing wins change your mood?"
    ],
    scripture: "Psalm 103:2 - Forget not all His benefits.",
    affirmation: "I record my victories and build evidence of growth."
  },
  {
    title: "Lesson 2.5 - Failure as Feedback",
    theme: "using failure as information instead of identity",
    keyIdeas: [
      "feedback mindset",
      "learning cycles",
      "adjustment not shame",
      "resilience",
      "growth through iteration"
    ],
    obstacles: [
      "shame after mistakes",
      "fear of trying again",
      "labeling yourself as failure"
    ],
    practiceSteps: [
      "Identify one recent failure.",
      "List the facts of what happened.",
      "Write one lesson and one adjustment.",
      "Try again with the adjustment.",
      "Record the result without judgment."
    ],
    reflectionQuestions: [
      "What did your last failure teach you?",
      "How can you separate your identity from outcomes?",
      "What is your next attempt?"
    ],
    scripture: "Micah 7:8 - Though I fall, I will rise.",
    affirmation: "I learn from failure and grow stronger each time."
  },
  {
    title: "Lesson 3.1 - Understanding Courage",
    theme: "choosing action despite fear",
    keyIdeas: [
      "fear is normal",
      "action over emotion",
      "courage as a muscle",
      "small steps",
      "evidence through action"
    ],
    obstacles: [
      "waiting to feel ready",
      "overthinking risks",
      "avoiding discomfort"
    ],
    practiceSteps: [
      "Name one fear you are avoiding.",
      "Define the smallest courageous step.",
      "Take that step today.",
      "Write what happened and how you felt.",
      "Repeat tomorrow with a similar step."
    ],
    reflectionQuestions: [
      "Where do you need more courage?",
      "What action would prove it?",
      "How does courage change your identity?"
    ],
    scripture: "Psalm 27:1 - The Lord is my light and salvation; whom shall I fear?",
    affirmation: "I act with courage even when fear is present."
  },
  {
    title: "Lesson 3.2 - Small Risks Build Confidence",
    theme: "expanding comfort zones through small, steady risks",
    keyIdeas: [
      "comfort zone expansion",
      "small wins",
      "graded exposure",
      "steady growth",
      "confidence through repetition"
    ],
    obstacles: [
      "seeking big dramatic change",
      "skipping the basics",
      "quitting after small discomfort"
    ],
    practiceSteps: [
      "Write three small risks you can take.",
      "Pick the easiest one and do it today.",
      "Record the outcome and what you learned.",
      "Repeat with the second risk tomorrow.",
      "After a week, review your progress."
    ],
    reflectionQuestions: [
      "Which small risk feels most doable?",
      "What is one area you want to expand?",
      "How does repetition change your confidence?"
    ],
    scripture: "Zechariah 4:10 - Do not despise small beginnings.",
    affirmation: "Small risks build big confidence in my life."
  },
  {
    title: "Lesson 3.3 - Action Creates Confidence",
    theme: "building confidence by taking action before you feel ready",
    keyIdeas: [
      "action precedes confidence",
      "experience creates belief",
      "momentum",
      "learning by doing",
      "evidence-based identity"
    ],
    obstacles: [
      "waiting for perfect timing",
      "over-planning",
      "fear of imperfection"
    ],
    practiceSteps: [
      "Choose one action you have delayed.",
      "Break it into a 10-minute step.",
      "Do the 10-minute step today.",
      "Record what you learned.",
      "Plan the next step immediately."
    ],
    reflectionQuestions: [
      "Where are you waiting instead of acting?",
      "What is one step you can take right now?",
      "How does action change your confidence level?"
    ],
    scripture: "Psalm 37:5 - Commit your way to the Lord; trust in Him and He will act.",
    affirmation: "I take action and confidence follows my movement."
  },
  {
    title: "Lesson 3.4 - Building Momentum",
    theme: "using consistent action to create flow and confidence",
    keyIdeas: [
      "consistency",
      "habit loops",
      "momentum",
      "reduced resistance",
      "daily discipline"
    ],
    obstacles: [
      "inconsistency",
      "seeking quick results",
      "overcommitting and burning out"
    ],
    practiceSteps: [
      "Choose one daily habit for confidence.",
      "Set a specific time to do it.",
      "Track it for seven days.",
      "Reduce friction by preparing in advance.",
      "Celebrate consistency, not perfection."
    ],
    reflectionQuestions: [
      "What habit would build momentum for you?",
      "Where do you lose momentum and why?",
      "What system could keep you moving?"
    ],
    scripture: "Hebrews 12:1 - Let us run with perseverance the race marked out for us.",
    affirmation: "I build momentum through steady, consistent action."
  },
  {
    title: "Lesson 3.5 - Faith and Action",
    theme: "pairing belief with consistent effort",
    keyIdeas: [
      "faith expressed through action",
      "belief and discipline",
      "inner strength",
      "purpose-driven effort",
      "spiritual confidence"
    ],
    obstacles: [
      "passivity",
      "doubting your calling",
      "inconsistent effort"
    ],
    practiceSteps: [
      "Write one promise you believe from Scripture.",
      "Choose one action that aligns with it.",
      "Take that action today.",
      "Thank God for the strength to act.",
      "Repeat tomorrow with another aligned action."
    ],
    reflectionQuestions: [
      "Where do you need faith to move you?",
      "What action would demonstrate your belief?",
      "How does faith change your courage?"
    ],
    scripture: "James 2:17 - Faith without works is dead.",
    affirmation: "I combine faith with action and grow stronger each day."
  },
  {
    title: "Lesson 4.1 - Resilience",
    theme: "recovering after setbacks and growing stronger",
    keyIdeas: [
      "bounce back ability",
      "learning from pain",
      "emotional endurance",
      "adaptability",
      "confidence through recovery"
    ],
    obstacles: [
      "avoiding hard lessons",
      "quitting too quickly",
      "identifying with setbacks"
    ],
    practiceSteps: [
      "Recall a past setback you overcame.",
      "List the skills that helped you recover.",
      "Choose one resilience skill to practice this week.",
      "Face a small challenge with that skill.",
      "Reflect on how you handled it."
    ],
    reflectionQuestions: [
      "What setback shaped you the most?",
      "How did you recover?",
      "What resilience skill do you want to strengthen?"
    ],
    scripture: "Isaiah 40:31 - Those who hope in the Lord will renew their strength.",
    affirmation: "I recover, I learn, and I rise stronger."
  },
  {
    title: "Lesson 4.2 - Affirmations and Identity",
    theme: "using affirmations to reinforce a stronger identity",
    keyIdeas: [
      "identity statements",
      "consistent repetition",
      "positive self-perception",
      "alignment with action",
      "mind training"
    ],
    obstacles: [
      "using affirmations without action",
      "choosing statements you do not believe",
      "inconsistency"
    ],
    practiceSteps: [
      "Write three affirmations that feel believable.",
      "Say them morning and evening.",
      "Link one affirmation to one action.",
      "Track how your mood responds.",
      "Refine the affirmations after one week."
    ],
    reflectionQuestions: [
      "Which affirmation feels most powerful?",
      "What action would make it more real?",
      "How has your self-talk changed?"
    ],
    scripture: "Psalm 139:14 - I am fearfully and wonderfully made.",
    affirmation: "My words align with my identity and build my confidence."
  },
  {
    title: "Lesson 4.3 - Environment and Influence",
    theme: "choosing relationships and spaces that build confidence",
    keyIdeas: [
      "supportive community",
      "positive influence",
      "boundaries",
      "role models",
      "growth environments"
    ],
    obstacles: [
      "negative relationships",
      "toxic inputs",
      "isolation"
    ],
    practiceSteps: [
      "List three people who uplift you.",
      "Spend time with one of them this week.",
      "Limit one negative influence.",
      "Create one positive input habit (book, podcast, mentor).",
      "Evaluate your environment weekly."
    ],
    reflectionQuestions: [
      "Who strengthens your confidence?",
      "What influence weakens it?",
      "How can you reshape your environment?"
    ],
    scripture: "Proverbs 13:20 - Walk with the wise and become wise.",
    affirmation: "I choose environments and people that strengthen me."
  },
  {
    title: "Lesson 4.4 - Protecting Your Mind",
    theme: "guarding mental inputs to build stable confidence",
    keyIdeas: [
      "attention management",
      "input filtering",
      "mental boundaries",
      "healthy media diet",
      "inner peace"
    ],
    obstacles: [
      "constant negative content",
      "doom scrolling",
      "unfiltered conversations"
    ],
    practiceSteps: [
      "Identify one negative input to reduce.",
      "Replace it with a growth input.",
      "Set a daily time limit for unhelpful media.",
      "Add a quiet time habit (prayer, journaling).",
      "Track your mental state for one week."
    ],
    reflectionQuestions: [
      "What content drains your confidence?",
      "What content builds it?",
      "How will you guard your mind this week?"
    ],
    scripture: "Philippians 4:8 - Think about whatever is true, noble, right, pure, lovely.",
    affirmation: "I guard my mind and feed it with truth and strength."
  },
  {
    title: "Lesson 4.5 - Quiet Confidence",
    theme: "building inner security without external validation",
    keyIdeas: [
      "inner security",
      "calm strength",
      "self-trust",
      "value-based action",
      "consistent character"
    ],
    obstacles: [
      "seeking approval",
      "performing for praise",
      "over-explaining yourself"
    ],
    practiceSteps: [
      "Identify one area where you seek approval.",
      "Choose one action based on your values, not opinions.",
      "Practice quiet confidence by staying calm and consistent.",
      "Write down how it felt.",
      "Repeat in another area this week."
    ],
    reflectionQuestions: [
      "Where do you seek validation most?",
      "What would calm confidence look like in that area?",
      "How can you practice quiet strength daily?"
    ],
    scripture: "1 Peter 3:4 - The unfading beauty of a gentle and quiet spirit.",
    affirmation: "I am calm, grounded, and confident in who I am."
  },
  {
    title: "Lesson 5.1 - Living Without Fear of Judgment",
    theme: "pursuing your purpose without being controlled by opinions",
    keyIdeas: [
      "values over approval",
      "purpose focus",
      "healthy boundaries",
      "self-respect",
      "freedom to act"
    ],
    obstacles: [
      "people-pleasing",
      "fear of criticism",
      "overthinking others opinions"
    ],
    practiceSteps: [
      "Name a value that matters most to you.",
      "Choose one action that expresses that value.",
      "Do it without explaining yourself.",
      "Notice how it feels to act freely.",
      "Repeat this week with another value."
    ],
    reflectionQuestions: [
      "Where does judgment fear show up most?",
      "What would you do if opinions did not matter?",
      "How can you act from your values today?"
    ],
    scripture: "Galatians 1:10 - Am I now trying to win human approval, or God's approval?",
    affirmation: "I live by my values, not by fear of judgment."
  },
  {
    title: "Lesson 5.2 - Reframing Challenges",
    theme: "seeing obstacles as training rather than threats",
    keyIdeas: [
      "perspective shift",
      "growth opportunities",
      "curiosity",
      "problem solving",
      "learning mindset"
    ],
    obstacles: [
      "catastrophic thinking",
      "victim mindset",
      "avoiding hard tasks"
    ],
    practiceSteps: [
      "Identify one current challenge.",
      "Write two possible benefits from it.",
      "Ask what skill this challenge can build.",
      "Take one small action toward the solution.",
      "Reflect on what you learned."
    ],
    reflectionQuestions: [
      "What challenge are you facing now?",
      "How could it serve your growth?",
      "What is the next right action?"
    ],
    scripture: "Romans 8:28 - In all things God works for the good of those who love Him.",
    affirmation: "I reframe challenges into opportunities for growth."
  },
  {
    title: "Lesson 5.3 - Remembering Past Victories",
    theme: "using past wins as evidence of strength",
    keyIdeas: [
      "memory as evidence",
      "confidence from history",
      "gratitude",
      "resilience reminders",
      "identity reinforcement"
    ],
    obstacles: [
      "forgetting your wins",
      "minimizing achievements",
      "dwelling on failures"
    ],
    practiceSteps: [
      "Write five victories from your past.",
      "Describe what each victory proves about you.",
      "Choose one victory to review daily this week.",
      "Use that victory to face a current challenge.",
      "Add new wins to the list weekly."
    ],
    reflectionQuestions: [
      "Which past victory feels most powerful?",
      "What does it reveal about your strength?",
      "How can it fuel your current goals?"
    ],
    scripture: "Psalm 77:11 - I will remember the deeds of the Lord.",
    affirmation: "My history shows I am strong, and I trust that strength."
  },
  {
    title: "Lesson 5.4 - Progress Over Perfection",
    theme: "releasing perfectionism and committing to growth",
    keyIdeas: [
      "progress mindset",
      "permission to learn",
      "iterative growth",
      "self-compassion",
      "consistent practice"
    ],
    obstacles: [
      "perfection paralysis",
      "fear of making mistakes",
      "harsh self-criticism"
    ],
    practiceSteps: [
      "Choose one area where you want progress.",
      "Define a small, imperfect action.",
      "Do the action today.",
      "Write one thing you learned.",
      "Plan the next imperfect action."
    ],
    reflectionQuestions: [
      "Where has perfectionism slowed you down?",
      "What does progress look like today?",
      "How can you celebrate small steps?"
    ],
    scripture: "Ecclesiastes 7:20 - There is no one on earth who is righteous and never sins.",
    affirmation: "I choose progress, and my confidence grows with each step."
  },
  {
    title: "Lesson 5.5 - Strength Through Faith",
    theme: "drawing strength from faith for confident action",
    keyIdeas: [
      "spiritual strength",
      "trust in God",
      "courage from faith",
      "purpose alignment",
      "perseverance"
    ],
    obstacles: [
      "self-reliance alone",
      "discouragement",
      "forgetting your source of strength"
    ],
    practiceSteps: [
      "Write a short prayer for courage.",
      "Take one action you have delayed.",
      "Thank God for the strength to act.",
      "Share your progress with someone you trust.",
      "Repeat with another step tomorrow."
    ],
    reflectionQuestions: [
      "How does faith change your confidence?",
      "What action can you take with faith today?",
      "Where do you need God's strength most?"
    ],
    scripture: "Philippians 4:13 - I can do all things through Christ who strengthens me.",
    affirmation: "My strength comes from God, and I act with courage."
  },
  {
    title: "Lesson 6.1 - Final Reflection: The Confidence Code Going Forward",
    theme: "integrating the course and committing to lifelong confidence habits",
    keyIdeas: [
      "review and integration",
      "long-term habits",
      "identity alignment",
      "purposeful action",
      "sustained growth"
    ],
    obstacles: [
      "forgetting what you learned",
      "losing momentum",
      "returning to old patterns"
    ],
    practiceSteps: [
      "Review your notes and highlight key insights.",
      "Choose three habits you will keep.",
      "Set a weekly check-in for the next month.",
      "Share your goals with a trusted friend.",
      "Celebrate your progress and recommit."
    ],
    reflectionQuestions: [
      "What new belief about yourself has formed?",
      "What action will you continue this week?",
      "How will you maintain your confidence habits?"
    ],
    scripture: "Philippians 1:6 - He who began a good work in you will carry it on to completion.",
    affirmation: "I continue this journey with courage, clarity, and consistent action."
  }
];

async function main() {
  const lessonMap = new Map(lessons.map((l) => [l.title, l]));
  const dbLessons = await pool.query(
    `SELECT l.id, l.title
     FROM lessons l
     JOIN modules m ON l.module_id = m.id
     WHERE m.course_id = $1`,
    [COURSE_ID]
  );

  for (const row of dbLessons.rows) {
    if (row.title === "Lesson 0.1 - Welcome to the Confidence Code") {
      continue;
    }
    const data = lessonMap.get(row.title);
    if (!data) continue;
    const body = buildLessonText(data);
    const description = body.slice(0, 220);

    await pool.query(
      "UPDATE lesson_content SET body = $1 WHERE lesson_id = $2 AND content_type = 'text'",
      [body, row.id]
    );
    await pool.query(
      "UPDATE lessons SET content = $1, description = $2, lesson_type = $3 WHERE id = $4",
      [body, description, "video", row.id]
    );
  }

  console.log("Expanded lesson content updated.");
}

main()
  .catch((err) => {
    console.error("Expansion failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

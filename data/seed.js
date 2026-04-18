const Company = require("../models/Company");
const Question = require("../models/Question");
const Subject = require("../models/Subject");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { inspect } = require("util");
const { getEnv } = require("../config/env");

const COMPANIES = [
  "Amazon",
  "Google",
  "Microsoft",
  "Apple",
  "Meta",
  "Netflix",
  "Adobe",
  "Uber",
  "Airbnb",
  "Flipkart",
  "Walmart",
  "Oracle",
  "IBM",
  "Intel",
  "Cisco",
  "Salesforce",
  "SAP",
  "PayPal",
  "Stripe",
  "Twitter (X)",
  "LinkedIn",
  "Dropbox",
  "Atlassian",
  "Zoho",
  "TCS",
  "Infosys",
  "Wipro",
  "Accenture",
  "Cognizant",
  "Capgemini",
  "HCL",
  "Goldman Sachs",
  "Morgan Stanley",
  "JP Morgan",
  "Barclays",
  "HSBC",
  "Razorpay",
  "PhonePe",
  "Paytm",
  "Swiggy",
  "Zomato",
  "Meesho",
  "Byju’s",
  "Ola",
  "Samsung",
  "Nvidia",
  "Qualcomm",
  // extra (still "top companies") to exceed 50
  "ByteDance",
  "Tencent",
  "Tesla",
  "SpaceX",
  "Intuit",
  "Bloomberg",
  "Epic Systems",
  "Red Hat",
  "VMware",
  "Shopify",
];

const QUESTION_POOL = [
  { title: "Two Sum", difficulty: "Easy" },
  { title: "Valid Parentheses", difficulty: "Easy" },
  { title: "Merge Two Sorted Lists", difficulty: "Easy" },
  { title: "Best Time to Buy and Sell Stock", difficulty: "Easy" },
  { title: "Maximum Subarray", difficulty: "Medium" },
  { title: "Product of Array Except Self", difficulty: "Medium" },
  { title: "Find Minimum in Rotated Sorted Array", difficulty: "Medium" },
  { title: "Search in Rotated Sorted Array", difficulty: "Medium" },
  { title: "Longest Substring Without Repeating Characters", difficulty: "Medium" },
  { title: "Group Anagrams", difficulty: "Medium" },
  { title: "Top K Frequent Elements", difficulty: "Medium" },
  { title: "3Sum", difficulty: "Medium" },
  { title: "Container With Most Water", difficulty: "Medium" },
  { title: "Kth Largest Element in an Array", difficulty: "Medium" },
  { title: "Merge Intervals", difficulty: "Medium" },
  { title: "Binary Tree Level Order Traversal", difficulty: "Medium" },
  { title: "Lowest Common Ancestor of a Binary Tree", difficulty: "Medium" },
  { title: "Word Break", difficulty: "Medium" },
  { title: "Coin Change", difficulty: "Medium" },
  { title: "Climbing Stairs", difficulty: "Easy" },
  { title: "Invert Binary Tree", difficulty: "Easy" },
  { title: "LRU Cache", difficulty: "Hard" },
  { title: "Median of Two Sorted Arrays", difficulty: "Hard" },
  { title: "Trapping Rain Water", difficulty: "Hard" },
  { title: "Merge k Sorted Lists", difficulty: "Hard" },
  { title: "Serialize and Deserialize Binary Tree", difficulty: "Hard" },
  { title: "Minimum Window Substring", difficulty: "Hard" },
  { title: "Regular Expression Matching", difficulty: "Hard" },
  { title: "Course Schedule", difficulty: "Medium" },
  { title: "Number of Islands", difficulty: "Medium" },
  { title: "Pacific Atlantic Water Flow", difficulty: "Medium" },
  { title: "Detect Cycle in Linked List", difficulty: "Easy" },
  { title: "Reorder List", difficulty: "Medium" },
  { title: "Add Two Numbers", difficulty: "Medium" },
];

const SUBJECT_KEYS = ["OS", "OOP", "DBMS", "CN"];

const SUBJECT_QUESTION_SEEDS = {
  OS: [
    { title: "Process vs Thread", company: "Microsoft", difficulty: "Easy" },
    { title: "What is Deadlock?", company: "Oracle", difficulty: "Easy" },
    { title: "CPU Scheduling Algorithms", company: "Amazon", difficulty: "Medium" },
    { title: "Paging vs Segmentation", company: "Google", difficulty: "Medium" },
    { title: "Critical Section Problem", company: "IBM", difficulty: "Hard" },
  ],
  DBMS: [
    { title: "What is Normalization?", company: "Amazon", difficulty: "Easy" },
    { title: "Types of Keys in DBMS", company: "Google", difficulty: "Easy" },
    { title: "SQL Joins Explained", company: "Microsoft", difficulty: "Medium" },
    { title: "Transaction ACID Properties", company: "Oracle", difficulty: "Medium" },
    { title: "Indexing in Databases", company: "Flipkart", difficulty: "Hard" },
  ],
  CN: [
    { title: "What is the OSI Model?", company: "Cisco", difficulty: "Easy" },
    { title: "TCP vs UDP", company: "Amazon", difficulty: "Easy" },
    { title: "HTTP and HTTPS", company: "Google", difficulty: "Medium" },
    { title: "DNS Working", company: "Microsoft", difficulty: "Medium" },
    { title: "Congestion Control", company: "Nvidia", difficulty: "Hard" },
  ],
  OOP: [
    { title: "Encapsulation in OOP", company: "Meta", difficulty: "Easy" },
    { title: "Inheritance vs Polymorphism", company: "Amazon", difficulty: "Easy" },
    { title: "Abstraction in OOP", company: "Google", difficulty: "Medium" },
    { title: "SOLID Principles", company: "Microsoft", difficulty: "Medium" },
    { title: "Design a Class Hierarchy", company: "Oracle", difficulty: "Hard" },
  ],
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sampleUnique(arr, count) {
  const copy = [...arr];
  const out = [];
  while (out.length < count && copy.length) {
    const idx = randInt(0, copy.length - 1);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function leetcodeSearchUrl(title) {
  return `https://leetcode.com/problemset/?search=${encodeURIComponent(title)}`;
}

async function dropLegacyQuestionIndexes() {
  const legacyIndexes = ["company_1_title_1", "company_1_subject_1_title_1"];

  for (const indexName of legacyIndexes) {
    try {
      await Question.collection.dropIndex(indexName);
      console.log(`[seed.questions] dropped legacy index ${indexName}`);
    } catch (error) {
      const message = String(error?.message || "");
      if (!message.includes("index not found") && !message.includes("index not exist")) {
        console.error(`[seed.questions] failed to drop index ${indexName}`);
        console.error(inspect(error, { depth: null, colors: false }));
      }
    }
  }
}

async function seedIfNeeded() {
  const companyCount = await Company.countDocuments();
  const questionCount = await Question.countDocuments();

  if (companyCount === 0) {
    await Company.deleteMany({});
    const companyDocs = COMPANIES.map((name) => ({ name }));
    await Company.insertMany(companyDocs, { ordered: false });
  }

  const questionsToInsert = [];
  for (const subject of SUBJECT_KEYS) {
    const subjectQuestions = SUBJECT_QUESTION_SEEDS[subject] || [];
    for (const item of subjectQuestions) {
      const existing = await Question.findOne({
        subject,
        title: item.title,
        company: item.company,
      })
        .select("_id")
        .lean();

      if (existing) continue;

      questionsToInsert.push({
        title: item.title,
        company: item.company,
        subject,
        difficulty: item.difficulty,
        link: leetcodeSearchUrl(item.title),
      });
    }
  }

  if (questionsToInsert.length > 0) {
    await dropLegacyQuestionIndexes();
    try {
      const insertedDocs = await Question.insertMany(questionsToInsert, { ordered: false });
      console.log("[seed.questions] insertedDocs", inspect(insertedDocs, { depth: null, colors: false }));
    } catch (error) {
      console.error("[seed.questions] insertMany failed");
      console.error(inspect(error, { depth: null, colors: false }));

      const upsertOps = questionsToInsert.map((doc) => ({
        updateOne: {
          filter: {
            title: doc.title,
            company: doc.company,
            subject: doc.subject,
          },
          update: { $setOnInsert: doc },
          upsert: true,
        },
      }));

      const bulkResult = await Question.bulkWrite(upsertOps, { ordered: false });
      console.log("[seed.questions] bulkWrite fallback", inspect(bulkResult, { depth: null, colors: false }));
    }
  }
  const seededCompanyCount = await Company.countDocuments();
  const seededQuestionCount = await Question.countDocuments();

  return {
    seeded: questionsToInsert.length > 0 || companyCount === 0,
    companyCount: seededCompanyCount,
    questionCount: seededQuestionCount,
  };
}

async function seedAdminUser() {
  const env = getEnv();
  const adminEmail = String(env.ADMIN_EMAIL || "").trim().toLowerCase();
  const adminPassword = String(env.ADMIN_PASSWORD || "").trim();

  if (!adminEmail || !adminPassword) {
    return { seeded: false, reason: "missing_admin_env" };
  }

  const existing = await User.findOne({ email: adminEmail }).lean();
  if (existing) {
    if (existing.role !== "admin") {
      await User.updateOne({ _id: existing._id }, { $set: { role: "admin" } });
    }
    return { seeded: false, reason: "already_exists" };
  }

  try {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await User.create({
      email: adminEmail,
      passwordHash,
      name: "Admin",
      role: "admin",
    });
  } catch (error) {
    if (error && error.code === 11000) {
      return { seeded: false, reason: "already_exists" };
    }
    throw error;
  }

  return { seeded: true, email: adminEmail };
}

async function seedDefaultSubjects() {
  const defaults = [
    {
      key: "OS",
      title: "Operating Systems",
      shortTitle: "OS",
      description: "Processes, scheduling, memory, and concurrency fundamentals.",
      icon: "layers",
      topics: ["Process vs Thread", "Deadlock", "Scheduling", "Paging"],
    },
    {
      key: "OOP",
      title: "Object-Oriented Programming",
      shortTitle: "OOP",
      description: "Core principles for clean and reusable software design.",
      icon: "cube",
      topics: ["Encapsulation", "Inheritance", "Polymorphism", "Abstraction"],
    },
    {
      key: "DBMS",
      title: "DBMS",
      shortTitle: "DBMS",
      description: "Relational modeling, transactions, indexing, and SQL design.",
      icon: "database",
      topics: ["Normalization", "Indexing", "Transactions", "Joins"],
    },
    {
      key: "CN",
      title: "Computer Networks",
      shortTitle: "CN",
      description: "Network layers, transport protocols, DNS, and web communication.",
      icon: "network",
      topics: ["OSI Model", "TCP/IP", "HTTP", "DNS"],
    },
  ];

  let created = 0;
  for (const subject of defaults) {
    const existing = await Subject.findOne({
      key: { $regex: `^${subject.key}$`, $options: "i" },
    })
      .select("_id")
      .lean();
    if (existing) continue;
    await Subject.create(subject);
    created += 1;
  }

  return { created };
}

module.exports = { seedIfNeeded, seedAdminUser, seedDefaultSubjects, COMPANIES };


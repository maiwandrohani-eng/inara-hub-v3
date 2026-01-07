// Utility to detect categories and subcategories from file names and metadata
import { libraryCategories, policyCategories } from '../config/categories.js';

interface CategoryMatch {
  category: string;
  subcategory?: string;
  confidence: number;
}

/**
 * Detects category and subcategory from folder path
 * Example: "HR/Recruitment/file.pdf" -> category: "HR", subcategory: "Recruitment"
 */
export function detectCategoryFromPath(
  folderPath: string,
  type: 'library' | 'policy' | 'template'
): CategoryMatch {
  if (!folderPath) {
    return { category: '', confidence: 0 };
  }

  // Split path into parts
  const parts = folderPath.split('/').filter(p => p.trim());
  
  if (parts.length === 0) {
    return { category: '', confidence: 0 };
  }

  // First part is usually the category
  const categoryPart = parts[0].trim();
  const subcategoryPart = parts.length > 1 ? parts[1].trim() : undefined;

  const categories = type === 'library' ? libraryCategories : policyCategories;

  // Try to match category
  let bestCategory = '';
  let bestCategoryScore = 0;

  for (const [category, subcategories] of Object.entries(categories)) {
    const categoryLower = category.toLowerCase();
    const partLower = categoryPart.toLowerCase();

    // Exact match
    if (categoryLower === partLower || partLower.includes(categoryLower) || categoryLower.includes(partLower)) {
      bestCategory = category;
      bestCategoryScore = 10;
      break;
    }

    // Partial match
    const categoryWords = categoryLower.split(/\s+/);
    const partWords = partLower.split(/\s+/);
    let score = 0;
    for (const catWord of categoryWords) {
      for (const partWord of partWords) {
        if (catWord === partWord || catWord.includes(partWord) || partWord.includes(catWord)) {
          score += 3;
        }
      }
    }
    if (score > bestCategoryScore) {
      bestCategoryScore = score;
      bestCategory = category;
    }
  }

  // Try to match subcategory
  let bestSubcategory: string | undefined;
  if (bestCategory && subcategoryPart) {
    const subcategories = (categories as Record<string, string[]>)[bestCategory] || [];
    let bestSubScore = 0;

    for (const subcategory of subcategories) {
      const subLower = subcategory.toLowerCase();
      const partLower = subcategoryPart.toLowerCase();

      if (subLower === partLower || partLower.includes(subLower) || subLower.includes(partLower)) {
        bestSubcategory = subcategory;
        bestSubScore = 10;
        break;
      }

      // Partial match
      const subWords = subLower.split(/\s+/);
      const partWords = partLower.split(/\s+/);
      let score = 0;
      for (const subWord of subWords) {
        for (const partWord of partWords) {
          if (subWord === partWord || subWord.includes(partWord) || partWord.includes(subWord)) {
            score += 2;
          }
        }
      }
      if (score > bestSubScore) {
        bestSubScore = score;
        bestSubcategory = subcategory;
      }
    }
  }

  // If no match found, use folder name as category
  if (!bestCategory && categoryPart) {
    bestCategory = categoryPart;
    bestCategoryScore = 1;
  }

  return {
    category: bestCategory,
    subcategory: bestSubcategory,
    confidence: bestCategoryScore,
  };
}

/**
 * Detects category and subcategory from file name or title
 */
export function detectCategory(
  fileName: string,
  type: 'library' | 'policy' | 'template'
): CategoryMatch {
  const normalizedName = fileName.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = normalizedName.split(/\s+/).filter(w => w.length > 2);

  let bestMatch: CategoryMatch = {
    category: '',
    confidence: 0,
  };

  const categories = type === 'library' ? libraryCategories : policyCategories;

  // Check each category and subcategory
  for (const [category, subcategories] of Object.entries(categories)) {
    const categoryWords = category.toLowerCase().split(/\s+/);
    let categoryScore = 0;

    // Check if category keywords match
    for (const word of words) {
      for (const catWord of categoryWords) {
        if (catWord.includes(word) || word.includes(catWord)) {
          categoryScore += 2;
        }
      }
    }

    // Check subcategories
    let bestSubcategory: string | undefined;
    let bestSubScore = 0;

    for (const subcategory of subcategories) {
      const subWords = subcategory.toLowerCase().split(/\s+/);
      let subScore = 0;

      for (const word of words) {
        for (const subWord of subWords) {
          if (subWord.includes(word) || word.includes(subWord)) {
            subScore += 3; // Subcategory matches are weighted higher
          }
        }
      }

      if (subScore > bestSubScore) {
        bestSubScore = subScore;
        bestSubcategory = subcategory;
      }
    }

    const totalScore = categoryScore + bestSubScore;

    if (totalScore > bestMatch.confidence) {
      bestMatch = {
        category,
        subcategory: bestSubcategory,
        confidence: totalScore,
      };
    }
  }

  // If no good match found, try common keywords
  if (bestMatch.confidence < 3) {
    const keywordMap: Record<string, string> = {
      // HR keywords
      hr: 'Human Resources',
      human: 'Human Resources',
      recruitment: 'Human Resources',
      staff: 'Human Resources',
      employee: 'Human Resources',
      // Finance keywords
      finance: 'Finance & Accounting',
      financial: 'Finance & Accounting',
      budget: 'Finance & Accounting',
      accounting: 'Finance & Accounting',
      // Procurement keywords
      procurement: 'Procurement & Logistics',
      logistics: 'Procurement & Logistics',
      vendor: 'Procurement & Logistics',
      // Safeguarding keywords
      safeguarding: 'Safeguarding & Protection',
      protection: 'Safeguarding & Protection',
      child: 'Safeguarding & Protection',
      psea: 'Safeguarding & Protection',
      gbv: 'Safeguarding & Protection',
      // Program keywords
      program: 'Program Management',
      project: 'Program Management',
      implementation: 'Program Management',
      // MEAL keywords
      meal: 'MEAL (Monitoring, Evaluation, Accountability & Learning)',
      monitoring: 'MEAL (Monitoring, Evaluation, Accountability & Learning)',
      evaluation: 'MEAL (Monitoring, Evaluation, Accountability & Learning)',
      // Security keywords
      security: 'Security & Safety',
      safety: 'Security & Safety',
      // Communications keywords
      communication: 'Communications & Advocacy',
      advocacy: 'Communications & Advocacy',
      media: 'Communications & Advocacy',
      // IT keywords
      it: 'Information Technology',
      technology: 'Information Technology',
      cyber: 'Information Technology',
      // Governance keywords
      governance: 'Governance & Compliance',
      compliance: 'Governance & Compliance',
      legal: 'Governance & Compliance',
    };

    for (const [keyword, category] of Object.entries(keywordMap)) {
      if (normalizedName.includes(keyword)) {
        bestMatch = {
          category,
          confidence: 2,
        };
        break;
      }
    }
  }

  return bestMatch;
}

/**
 * Detects resource type from file name
 */
export function detectResourceType(fileName: string): string {
  const normalizedName = fileName.toLowerCase();

  if (normalizedName.includes('sop') || normalizedName.includes('standard operating')) {
    return 'sop';
  }
  if (normalizedName.includes('guidance') || normalizedName.includes('guide')) {
    return 'guidance';
  }
  if (normalizedName.includes('research') || normalizedName.includes('study')) {
    return 'research';
  }
  if (normalizedName.includes('case study') || normalizedName.includes('case_study')) {
    return 'case_study';
  }
  if (normalizedName.includes('book') || normalizedName.includes('manual')) {
    return 'book';
  }

  return 'book'; // Default
}


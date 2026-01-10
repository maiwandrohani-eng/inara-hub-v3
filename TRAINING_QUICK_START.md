# Training Module - Quick Start Guide

## 📚 Creating a Course with Bulk Lessons & Questions

### Step 1: Go to Admin Panel
1. Log in as Admin
2. Click Admin Panel
3. Navigate to **Trainings**

### Step 2: Upload Course
1. Click **"+ Upload Course"** button
2. Choose **"Manual"** tab
3. Fill in course details (title, description, objectives)

### Step 3: Add Lessons in Bulk
1. Scroll to **"Lessons & Slides"** section
2. Click **"📦 Bulk Import Lessons"** (green button)
3. Copy and paste your lessons in this format:

```
LESSON: Lesson Title
LESSON_OVERVIEW: Brief description
SLIDE: Slide Title
- Bullet point 1
- Bullet point 2
- Bullet point 3

LESSON: Another Lesson
SLIDE: Another Slide
- Point 1
- Point 2
```

4. Click **"👁️ Preview Lessons"**
5. Review the preview
6. Click **"✅ Import N Lessons"**

### Step 4: Add Questions in Bulk
1. Scroll to **"Final Exam"** section
2. Click **"📦 Bulk Import"** (green button)
3. Keep **"Multiple Choice"** selected
4. Copy and paste your questions in this format:

```
Q1: What is the question?
- Option 1
- Option 2
- Option 3
- Option 4
A1: Option 1
E1: This is why Option 1 is correct

Q2: Another question?
- Option A
- Option B
- Option C
- Option D
A2: Option B
E2: Explanation for why B is correct
```

5. Click **"👁️ Preview Questions"**
6. Review the preview (correct answers show in green)
7. Click **"✅ Import N Questions"**

### Step 5: Add Resources (Optional)
1. Scroll down to **"All Trainings"** section
2. Find your course
3. Click the course card
4. Upload PDF files and documents

### Step 6: Save Course
1. Review all information
2. Click **"🚀 Save Course"** or appropriate submit button
3. Course is now ready for learners!

---

## 👨‍🎓 Taking a Course (For Learners)

### Browse Courses
1. Go to **Training Tab**
2. Use filters to find courses by:
   - Status (All, Mandatory, In Progress, Completed)
   - Course Type (Micro, Mandatory, Professional)
   - Category

### Start a Course
1. Click **"Start Course"** button on any course
2. You are automatically enrolled!
3. Course player opens immediately

### Learn Through Course
1. **Read slides** - Each slide has learning content
2. **Take micro-quizzes** - Answer questions after each slide
3. **View resources** - Click "👁️ Quick View" for PDFs
4. **Navigate** - Use Previous/Next buttons
5. **Track progress** - Watch progress bar at top

### View Course Resources
1. Look at **right sidebar** labeled "Course Resources"
2. Each resource shows:
   - 📄 File name and description
   - 📊 File type and size
   - Two options:
     - **📥 Download** - Save to your computer
     - **👁️ Quick View** - Preview inline (PDFs only)

### Complete Final Exam
1. After all slides, Final Exam appears
2. Answer all questions
3. Click **"Submit Exam"**
4. Get instant score

### Get Certificate
1. If you pass, certificate is automatically generated
2. Click **"View Certificate"** or go to "My Certificates" tab
3. Download and save your certificate

---

## 📋 Format Rules

### Bulk Lessons Format
✅ **Do This**:
```
LESSON: Clear Title
LESSON_OVERVIEW: Optional description
SLIDE: Descriptive Slide Title
- Bullet point
- Another point
```

❌ **Don't Do This**:
```
Lesson: Title (wrong keyword - use LESSON:)
SLIDE (missing title)
No bullet points on slide
```

### Bulk Questions Format
✅ **Do This**:
```
Q1: Clear question text?
- Option 1
- Option 2
- Option 3
- Option 4
A1: Option 1
E1: Why this is correct
```

❌ **Don't Do This**:
```
Q1: Question?
- Option 1
- Option 2
A1: Option 5 (doesn't exist!)
Q3: (not sequential)
```

---

## 🎯 Tips & Best Practices

### For Course Authors
1. **Test your format** - Use Preview before importing
2. **Keep it clear** - Use simple, descriptive titles
3. **Add context** - Use explanations in questions
4. **Organize logically** - Lessons should build on each other
5. **Add resources** - Include PDFs for deeper learning
6. **Check limits** - Max 100 lessons/questions per import

### For Learners
1. **Take notes** - Use Quick View to read PDFs while learning
2. **Don't skip** - Micro-quizzes help learning
3. **Review mistakes** - Read explanations if you get answers wrong
4. **Manage time** - Pacing is up to you
5. **Download resources** - Save PDFs for later reference

---

## ❓ Common Questions

**Q: Can I import 200 lessons at once?**
A: No, maximum is 100 per bulk import. Import twice if needed.

**Q: Can I edit questions after import?**
A: Yes, they appear as normal form fields that you can edit manually.

**Q: What if my format is wrong?**
A: The preview will show 0 results. Check your format against the guide and try again.

**Q: Do resources count toward course completion?**
A: No, but they're helpful for learning. Focus on completing lessons and passing the exam.

**Q: Can I view PDFs without downloading?**
A: Yes! Use the "👁️ Quick View" button - it opens the PDF in a modal.

**Q: Will students get certificates?**
A: Yes, automatically when they complete the course and pass the final exam!

---

## 🔧 Troubleshooting

### Bulk import shows "0 lessons/questions found"
- Check spelling of keywords (LESSON:, SLIDE:, Q#:, A#:)
- Ensure proper spacing between sections
- Copy/paste from the format guide provided in the UI

### PDF Quick View doesn't appear
- Only shows for PDF files (.pdf extension)
- Other formats (Word, Excel) show Download only
- Check that file is actually a PDF

### Course won't save
- Fill ALL required fields (marked with *)
- Add at least 1 lesson with 1 slide
- Select a valid course type and category
- Ensure passing score is between 0-100%

### Student can't enroll in course
- Check if course is Active
- Verify student has required role (if role-restricted)
- Check course is assigned to student's department/country (if restricted)

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review the format examples provided in the UI
3. Contact your system administrator

---

**Last Updated**: January 2026
**Version**: 1.0

# Faculty Appraisal Portal - Project Completion Walkthrough

## Summary of Completed Modules

We have successfully finished the remainder of the faculty appraisal portal, following the agreed-upon sequence. All requested features across Rubric Management, Evaluator Scoring, Student Feedback Integration, and Dean Moderation have been built.

---

### Module 1: Admin Rubric Management (Completed)
- **Rubric Builder (`/admin/rubrics`)**: Admins can now build dynamic, weighted grading rubrics.
- **Cycle Linking**: When creating an Appraisal Cycle, admins can now select and attach a specific Rubric.

### Module 2: Evaluator Scoring & Finalization (Completed)
- **Dynamic Grading Panel (`/evaluator/review/[id]`)**: Replaced the "Phase 8" placeholder with an interactive scoring panel that dynamically renders based on the rubric attached to the cycle.
- **Calculations & Penalties**: The form automatically calculates the total score, allows for penalty deductions, and ensures scores stay within limits.
- **Drafts & Finalization**: Evaluators can save their progress as a "Draft" or "Finalize" the evaluation. Once finalized, the scores are locked.
- **Dashboard Updates**: The Evaluator dashboard now accurately reflects whether a submission is pending review or completed.

### Module 3: Student Feedback Integration (Completed)
- **CSV Import Tool (`/admin/student-feedback`)**: Built a robust CSV parser (using PapaParse) that allows admins to upload large spreadsheets of student feedback. The tool automatically maps headers like Email, Course Name, and Scores.
- **Evaluator Visibility**: The Evaluator Review page now fetches and displays all imported student feedback metrics related to the specific faculty member being reviewed, placing it right above the submitted forms for easy reference during grading.

### Module 4: Dean Moderation & Analytics Reporting (Completed)
- **Moderation Dashboard (`/admin/moderation`)**: A unified view for Admins/Deans to see all finalized evaluations across all cycles and departments, complete with total scores and statuses.
- **CSV Export Engine**: Added a one-click "Export to CSV" button that generates a consolidated spreadsheet of all appraisal results for external reporting or HR systems.

---

## How to Test Everything End-to-End

Here are the step-by-step instructions you requested to verify all these new features:

### Step 1: Create a Grading Rubric (Admin)
1. Log in as an **Admin** (`admin@northbridge.demo`).
2. Go to **Grading Rubrics** in the sidebar.
3. Click **Create New Rubric**. Give it a name (e.g., "Standard 2025 Rubric").
4. Add your categories (e.g., Teaching, Research). Ensure you give each a max mark.
5. Click **Save Configuration**.

### Step 2: Attach to a Cycle (Admin)
1. Go to **Appraisal Cycles**.
2. Click **New Cycle**.
3. Fill in the details. You will now see two dropdowns: one for the **Form Template** and a new one for the **Grading Rubric**.
4. Select the rubric you just created and click **Create Cycle**. Note: Ensure the cycle is set to "Active".

### Step 3: Import Student Feedback (Admin)
1. Go to **Student Feedback** in the sidebar.
2. Select your active cycle from the dropdown.
3. Create a quick test CSV on your computer with columns like: `Email, Course Name, Average Score` (e.g., `testfaculty@example.com, Physics 101, 4.5`).
4. Upload the CSV and click **Upload & Import**. Verify it succeeds.

### Step 4: Submit an Appraisal (Faculty)
1. Log out, then log in as a **Faculty** member (ensure their email matches what you put in the CSV!).
2. They should see the active cycle on their dashboard. Fill out the self-appraisal form and **Submit** it.

### Step 5: Evaluate & See Feedback (Evaluator)
1. Log out, then log in as an **Evaluator**.
2. Go to the Evaluator Dashboard. You should see the faculty member's pending submission. Click **Evaluate**.
3. **Verify:** At the top of the review page, you should see the **Student Feedback Metrics** you uploaded in Step 3!
4. **Verify:** On the right side, you should see the **Evaluation Panel** dynamically rendering the categories you built in Step 1.
5. Enter some scores and click **Save Draft**. Check the dashboard (it should still say Evaluate).
6. Go back in and click **Finalize**. 

### Step 6: Review & Export (Admin / Dean)
1. Log back in as an **Admin**.
2. Go to **Dean Moderation** in the sidebar.
3. You should see the faculty member's finalized score in the table.
4. Click the green **Export to CSV** button at the top right to download your final analytics report!

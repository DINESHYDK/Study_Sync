# StudySync Email System Integration Guide

This directory contains production-ready HTML email templates designed for **StudySync**. They are pre-styled using email-safe, inlined CSS and are compatible with **Resend** and **Supabase Auth**.

---

## 1. Templates Overview & Copy Recommendations

Below is the metadata and text-fallback recommendations for each template:

### 1. Email Verification
* **Template File**: [`verification.html`](./verification.html)
* **Subject Line**: `Verify your StudySync Account 🚀` or `Confirm your email - StudySync`
* **Preview Text**: `Welcome to StudySync! Verify your email address to activate your account and start studying with friends.`
* **Plain-Text Fallback**:
  ```text
  Verify your StudySync Account
  
  Welcome to StudySync, {{name}}!
  Before you start tracking your sessions and competing with friends, please verify your email address by visiting this link:
  {{confirmation_url}}
  
  If you did not request this email, please ignore it.
  ```

### 2. Magic Link Login
* **Template File**: [`magic_link.html`](./magic_link.html)
* **Subject Line**: `Sign in to StudySync ⚡`
* **Preview Text**: `Click the link inside to log in instantly to your StudySync dashboard.`
* **Plain-Text Fallback**:
  ```text
  Sign in to StudySync
  
  Click the link below to sign in instantly. This link is valid for 15 minutes and can only be used once:
  {{magic_link}}
  ```

### 3. OTP Login
* **Template File**: [`otp.html`](./otp.html)
* **Subject Line**: `{{otp}} is your StudySync verification code`
* **Preview Text**: `Enter this code within 10 minutes to verify your login.`
* **Plain-Text Fallback**:
  ```text
  Your verification code is: {{otp}}
  
  Use this one-time code to complete your sign-in. This code is valid for 10 minutes. Do not share this code.
  ```

### 4. Password Reset
* **Template File**: [`password_reset.html`](./password_reset.html)
* **Subject Line**: `Reset your StudySync password`
* **Preview Text**: `Forgot your password? Click the link to securely choose a new one.`
* **Plain-Text Fallback**:
  ```text
  Reset your password
  
  Hey {{name}},
  We received a request to reset your StudySync password. Click the link below to set a new one:
  {{reset_url}}
  ```

### 5. Welcome Email
* **Template File**: [`welcome.html`](./welcome.html)
* **Subject Line**: `Welcome to StudySync! Ready to build focus? 📚`
* **Preview Text**: `Here is your quick guide to getting started, adding friends, and building consistent study habits.`
* **Plain-Text Fallback**:
  ```text
  Welcome to StudySync!
  
  Hey {{name}},
  We are thrilled to help you build better focus and consistency.
  
  1. Track with Precision: Label study sessions with subjects.
  2. Add Your Crew: Share your referral code.
  3. Compete & Win: Check daily metrics.
  
  Go to your dashboard: https://studysync.dineshydk.dev/dashboard
  ```

### 6. Invite Friend
* **Template File**: [`invite.html`](./invite.html)
* **Subject Line**: `{{friend_name}} invited you to join StudySync! 🤝`
* **Preview Text**: `Study together with {{friend_name}} on StudySync. Track focus, view crew activity, and build streaks.`
* **Plain-Text Fallback**:
  ```text
  Join {{friend_name}} on StudySync!
  
  Hey there,
  Your friend {{friend_name}} has invited you to join their study group on StudySync.
  Accept your invitation here: https://studysync.dineshydk.dev/signup
  ```

### 7. Weekly Progress Summary
* **Template File**: [`weekly_summary.html`](./weekly_summary.html)
* **Subject Line**: `Your StudySync Weekly Summary 📊`
* **Preview Text**: `You studied {{study_hours}} hours this week! See how you rank against your friends.`
* **Plain-Text Fallback**:
  ```text
  Your Weekly Summary
  
  Hey {{name}},
  Here is your progress this week:
  - Total Study Time: {{study_hours}}h
  - Daily Average: {{daily_avg}}h
  - Current Streak: {{streak_days}} Days
  - Tasks Completed: {{tasks_completed}}
  
  Go to dashboard: https://studysync.dineshydk.dev/dashboard
  ```

### 8. Study Streak Achievement
* **Template File**: [`streak.html`](./streak.html)
* **Subject Line**: `🔥 You hit a {{streak_days}}-day study streak!`
* **Preview Text**: `Unbelievable consistency! Keep your momentum going and lock in today's study session.`
* **Plain-Text Fallback**:
  ```text
  New Streak Unlocked: {{streak_days}} Days!
  
  Hey {{name}},
  Incredible consistency! You have maintained your study habit for {{streak_days}} consecutive days. Keep it up!
  ```

### 9. Friend Challenge Notification
* **Template File**: [`challenge.html`](./challenge.html)
* **Subject Line**: `⚔️ {{friend_name}} challenged you on StudySync!`
* **Preview Text**: `"Let's see who puts in more hours today. Loser buys coffee!" - Open the app to view.`
* **Plain-Text Fallback**:
  ```text
  {{friend_name}} challenged you!
  
  Hey {{name}},
  Your friend {{friend_name}} has challenged you to a head-to-head comparison match today.
  View the challenge: https://studysync.dineshydk.dev/friends
  ```

### 10. Invite User (Supabase Auth)
* **Template File**: [`invite_user.html`](./invite_user.html)
* **Subject Line**: `You've been invited to StudySync`
* **Preview Text**: `Set up your StudySync account to start tracking sessions and studying with friends.`
* **Plain-Text Fallback**:
  ```text
  You have been invited to join StudySync.
  Accept your invitation here: {{confirmation_url}}
  ```

### 11. Change Email Address (Supabase Auth)
* **Template File**: [`email_change.html`](./email_change.html)
* **Subject Line**: `Confirm your new StudySync email address`
* **Preview Text**: `Confirm the change of your email address from {{email}} to {{new_email}}.`
* **Plain-Text Fallback**:
  ```text
  Confirm your new email
  Click the link below to confirm the change of your email address from {{email}} to {{new_email}}:
  {{confirmation_url}}
  ```

### 12. Account Deletion Confirmation
* **Template File**: [`account_deleted.html`](./account_deleted.html)
* **Subject Line**: `Your StudySync account has been deleted`
* **Preview Text**: `All of your study logs and account details have been permanently removed.`
* **Plain-Text Fallback**:
  ```text
  Account successfully deleted.
  As requested, your StudySync account and all associated data have been permanently deleted from our databases.
  ```

---

## 2. Integration with Supabase Auth Templates

Supabase Auth uses Go template variables for email confirmations. You can copy the code from our HTML files directly and map variables as follows:

* Replace `{{confirmation_url}}` with `{{ .ConfirmationURL }}`
* Replace `{{magic_link}}` with `{{ .ConfirmationURL }}`
* Replace `{{reset_url}}` with `{{ .ConfirmationURL }}`
* Replace `{{otp}}` with `{{ .Token }}`
* Replace `{{email}}` with `{{ .Email }}`
* Replace `{{name}}` with `{{ .TokenHash }}` or handle metadata fallback.

---

## 3. Accessibility & Optimization Best Practices

* **Font Fallbacks**: Standard system sans-serif fonts are declared on every container so that the layout is clean even if external web fonts are blocked by the mail client.
* **Semantic Tables**: Screen readers are supported by setting `role="presentation"` on layout tables.
* **High Contrast**: Solid `#2dd4bf` (mint-teal) buttons and white text maintain a contrast ratio exceeding `4.5:1` against the dark surfaces.
* **Clean Padding**: All structures use nested table cells with inline padding styles. This prevents alignment breakage on native mobile Mail apps and desktop Outlook.

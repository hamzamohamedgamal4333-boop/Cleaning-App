# Skill Up Academy - Official Website & Portfolio

Welcome to the official repository for **Skill Up Academy** (`https://www.facebook.com/skillupacademy2`). 

This is a modern, high-performance, fully responsive one-page website designed to showcase Skill Up Academy's training programs, values, student testimonials, gallery, and contact channels.

---

## 🌟 Key Features

- **Modern Visual Aesthetics**: Indigo & Electric Cyan color palette with subtle animations, glassmorphism header, and responsive card layouts.
- **8 Comprehensive Sections**:
  1. **Hero / Home**: Branding, headline, call-to-action buttons, stats row, and visual badge showcase.
  2. **About Us**: Academy introduction, mission & vision statement cards, and practical highlights.
  3. **Courses & Services**: Interactive course cards with filtering tabs (Tech, Design, Business) and detailed curriculum pop-up modal.
  4. **Why Choose Us**: 6 feature cards detailing practical learning, experienced trainers, flexible schedules, and student support.
  5. **Gallery / Our Work**: Responsive media grid with full-screen lightbox image preview.
  6. **Testimonials**: Realistic student review cards with 5-star ratings.
  7. **Contact Us**: Official Facebook page link, WhatsApp, phone, email, location info, and an interactive contact form with client-side validation.
  8. **Footer**: Social links, quick navigation, popular course list, and dynamic copyright year.

---

## 📁 Project Directory Structure

```text
Portfolio Project/
├── index.html                 # Main HTML5 entry point
├── assets/
│   ├── css/
│   │   └── style.css          # CSS3 stylesheet with design tokens & responsive rules
│   ├── js/
│   │   └── script.js          # JavaScript logic (nav, modals, filters, lightbox, form)
│   └── images/
│       ├── hero-visual.png    # Hero section artwork
│       ├── about-img.png       # About section classroom illustration
│       ├── gallery-1.png      # Workshop photo
│       └── gallery-2.png      # Graduation photo
└── README.md                  # Documentation & customization guide
```

---

## ✏️ How to Modify Content & Placeholders

All customizable content items are explicitly tagged in the code so you can update them quickly:

| Placeholder Tag | Location in `index.html` | What to Replace With |
|---|---|---|
| `[ACADEMY DESCRIPTION]` | `<section id="about">` | Your full official academy description |
| `[COURSE NAME]` | `<section id="courses">` | Your exact course titles |
| `[COURSE DESCRIPTION]` | `<section id="courses">` | Detailed summary of each course |
| `[WHATSAPP NUMBER]` | `<section id="contact">` | Your official WhatsApp phone number |
| `[PHONE NUMBER]` | `<section id="contact">` | Your phone number |
| `[EMAIL]` | `<section id="contact">` & Footer | Your official email address |
| `[LOCATION]` | `<section id="contact">` & Footer | Your physical campus address |
| `[TESTIMONIAL]` | `<section id="testimonials">` | Quotes from real students |

---

## 🚀 How to Run Locally

1. Simply double-click `index.html` or open it in any modern web browser (Chrome, Edge, Firefox, Safari).
2. Alternatively, serve via VS Code Live Server or python HTTP server:
   ```bash
   python -m http.server 8000
   ```
   Then navigate to `http://localhost:8000` in your web browser.

---

## 🔗 Official Social Links

- **Facebook**: [facebook.com/skillupacademy2](https://www.facebook.com/skillupacademy2)

import streamlit as st


def show_landing_page():
    st.title("EduHub")
    st.subheader("The Ultimate Student AI Assistant")
    st.markdown(
        "EduHub helps students organize their courses, summarize PDF study material, and get AI-powered homework support. "
        "Everything is designed to make learning easier, faster, and more enjoyable."
    )

    col1, col2 = st.columns([2, 3])
    with col1:
        st.markdown("### Features")
        st.markdown("- 📚 Smart timetable planning")
        st.markdown("- 📝 PDF summarizer with study modes")
        st.markdown("- 🧠 Step-by-step assignment tutoring")
        st.markdown("- 🔐 Secure API key input")
        st.markdown("- ✨ Clean, student-friendly interface")
        st.markdown("---")
        st.markdown("### Why students love EduHub")
        st.markdown(
            "- Save time by organizing classes and study sessions in one dashboard.\n"
            "- Convert PDFs into easy-to-read summaries and flashcards.\n"
            "- Receive friendly, step-by-step homework guidance instead of just answers."
        )
    with col2:
        st.image(
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80",
            caption="Study smarter with AI-guided planning.",
            use_column_width=True,
        )

    st.markdown("---")
    st.markdown("### Get started")
    st.markdown(
        "Use the student dashboard to manage your schedule, summarize textbooks, and receive homework help from a warm, encouraging AI tutor."
    )

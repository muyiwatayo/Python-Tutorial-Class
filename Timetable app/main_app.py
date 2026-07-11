import streamlit as st
from landing import show_landing_page
from signup import show_signup_page
from edu_hub import (
    init_session_state,
    show_timetable_page,
    show_pdf_summary_page,
    show_assignment_help_page,
)

st.set_page_config(page_title="EduHub", page_icon="🎓", layout="wide")

PAGES = {
    "Home": show_landing_page,
    "Signup": show_signup_page,
    "EduHub Dashboard": None,
}


def main():
    st.sidebar.title("EduHub Navigation")
    st.sidebar.markdown("Welcome to EduHub — your student productivity hub.")
    page = st.sidebar.radio("Go to", list(PAGES.keys()))

    if page == "EduHub Dashboard":
        st.sidebar.markdown("---")
        api_key = st.sidebar.text_input(
            "OpenAI API Key",
            type="password",
            placeholder="sk-...",
            help="Enter your OpenAI API key to enable AI features.",
        ).strip()
        st.sidebar.markdown("---")
        st.sidebar.markdown("Use the sidebar to add your API key, then choose a student tool below.")

        PAGE_OPTIONS = [
            "🕒 Smart Timetable Manager",
            "📚 PDF Textbook & Note Summarizer",
            "📝 Assignment Help & Homework Solver",
        ]
        selected_tool = st.sidebar.radio("Dashboard tool", PAGE_OPTIONS)

        init_session_state()

        if selected_tool == PAGE_OPTIONS[0]:
            show_timetable_page(api_key)
        elif selected_tool == PAGE_OPTIONS[1]:
            show_pdf_summary_page(api_key)
        elif selected_tool == PAGE_OPTIONS[2]:
            show_assignment_help_page(api_key)
    else:
        PAGES[page]()


if __name__ == "__main__":
    main()

import streamlit as st
import pandas as pd
from pypdf import PdfReader
from openai import OpenAI

st.set_page_config(
    page_title="EduHub: The Ultimate Student AI Assistant",
    page_icon="🎓",
    layout="wide",
)

PAGE_OPTIONS = [
    "🕒 Smart Timetable Manager",
    "📚 PDF Textbook & Note Summarizer",
    "📝 Assignment Help & Homework Solver",
]

TIME_SLOTS = [
    "08:00 - 09:00",
    "09:15 - 10:15",
    "10:30 - 11:30",
    "12:30 - 13:30",
    "14:00 - 15:00",
]

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]


def init_session_state():
    if "timetable" not in st.session_state:
        st.session_state.timetable = pd.DataFrame(
            "",
            index=TIME_SLOTS,
            columns=DAYS,
        )
    if "last_summary" not in st.session_state:
        st.session_state.last_summary = ""
    if "last_tutor_reply" not in st.session_state:
        st.session_state.last_tutor_reply = ""


def get_api_client(api_key: str):
    return OpenAI(api_key=api_key)


def extract_text_from_response(response):
    if response is None:
        return ""
    if hasattr(response, "output_text") and response.output_text:
        return response.output_text
    text_parts = []
    output = getattr(response, "output", [])
    for item in output:
        for content in getattr(item, "content", []):
            if isinstance(content, str):
                text_parts.append(content)
            elif isinstance(content, dict) and content.get("type") == "output_text":
                text_parts.append(content.get("text", ""))
    return "\n".join(text_parts).strip()


def safe_pdf_text(uploaded_file):
    try:
        uploaded_file.seek(0)
        reader = PdfReader(uploaded_file)
        page_texts = [page.extract_text() or "" for page in reader.pages]
        full_text = "\n\n".join(page_texts).strip()
        if not full_text:
            raise ValueError("No text could be extracted from the PDF.")
        return full_text
    except Exception as exc:
        raise RuntimeError(f"PDF extraction failed: {exc}") from exc


def build_timetable_prompt(timetable: pd.DataFrame) -> str:
    schedule_lines = []
    for day in timetable.columns:
        schedule_lines.append(f"{day}:")
        for time_slot in timetable.index:
            entry = timetable.at[time_slot, day]
            schedule_lines.append(f"  - {time_slot}: {entry if entry else 'Free'}")
    schedule_text = "\n".join(schedule_lines)
    return (
        "You are an experienced student planner. Here is a student's current weekly class timetable:\n"
        f"{schedule_text}\n\n"
        "Create a personalized independent study schedule for the student that fits around their classes. "
        "Include recommended study blocks, suggested focus topics, and daily short review sessions. "
        "Keep the plan friendly, actionable, and easy to follow."
    )


def create_pdf_summary_prompt(summary_depth: str, document_text: str) -> str:
    return (
        "You are a helpful study assistant. A student uploaded a textbook or lecture notes and wants a summary. "
        f"Summary depth: {summary_depth}. "
        "Use the text below to generate a clean, student-friendly response in Markdown. "
        "If the student requested flashcard generation, output concise questions and answers. "
        "Keep formatting organized with headings and bullet points.\n\n"
        f"Document text:\n{document_text[:25000]}"
    )


def create_assignment_prompt(question: str, context_text: str) -> str:
    context_section = f"\n\nContext:\n{context_text}" if context_text else ""
    return (
        "You are a patient, encouraging tutor. A student provided a homework question and optional rubric/context. "
        "Do not just deliver the final answer immediately. Instead, explain the key concepts step-by-step, show the reasoning, and answer why each step matters. "
        "If the question can be broken into smaller parts, identify those parts and solve them clearly. "
        "Use friendly language and help the student build confidence.\n\n"
        f"Question:\n{question}{context_section}"
    )


def show_timetable_page(api_key: str):
    st.header("🕒 Smart Timetable Manager")
    st.markdown(
        "Use this page to build a weekly class view and generate an AI-optimized study schedule around your lessons."
    )

    st.subheader("Weekly class timetable")
    st.dataframe(st.session_state.timetable, use_container_width=True)

    with st.form("timetable_form"):
        st.markdown("**Add a new class**")
        cols = st.columns(2)
        with cols[0]:
            subject = st.text_input("Subject Name", max_chars=80)
            day = st.selectbox("Day", DAYS)
            time_slot = st.selectbox("Time Slot", TIME_SLOTS)
        with cols[1]:
            room = st.text_input("Room Number / Location", max_chars=30)
            note = st.text_area("Optional note", placeholder="Teacher name, lab, or topic")
        submitted = st.form_submit_button("Add class 📌")
        if submitted:
            if not subject.strip():
                st.warning("Please type a subject name before adding the class.")
            else:
                entry_value = subject.strip()
                if room.strip():
                    entry_value += f" | {room.strip()}"
                if note.strip():
                    entry_value += f"\n{note.strip()}"
                st.session_state.timetable.at[time_slot, day] = entry_value
                st.success("Class added to your timetable.")

    st.markdown("---")
    st.subheader("AI Study Plan Optimizer")
    if st.button("Optimize my study plan 🤖"):
        if not api_key:
            st.warning("Enter your OpenAI API key in the sidebar before using AI features.")
            return
        with st.spinner("Building your personalized study timetable..."):
            try:
                client = get_api_client(api_key)
                prompt = build_timetable_prompt(st.session_state.timetable)
                response = client.responses.create(
                    model="gpt-4o-mini",
                    input=prompt,
                    temperature=0.6,
                    max_output_tokens=700,
                )
                optimized_plan = extract_text_from_response(response)
                st.markdown("### Your Optimized Independent Study Plan")
                st.markdown(optimized_plan)
            except Exception as err:
                st.error(f"AI request failed: {err}")


def show_pdf_summary_page(api_key: str):
    st.header("📚 PDF Textbook & Note Summarizer")
    st.markdown(
        "Upload a PDF textbook or notes file, then choose how deep your summary should be."
    )

    pdf_file = st.file_uploader("Upload a PDF file", type=["pdf"], help="PDF textbooks, lecture notes, or study packets")
    summary_depth = st.selectbox(
        "Summary Depth",
        ["Quick TL;DR", "Detailed Notes", "Flashcard Generation"],
    )

    if pdf_file is not None:
        try:
            raw_text = safe_pdf_text(pdf_file)
            st.success("PDF text extracted successfully.")
            if len(raw_text) > 25000:
                st.info("The document is large, so the summary will use the first portion of the text for best performance.")
            if st.button("Generate summary 📝"):
                if not api_key:
                    st.warning("Enter your OpenAI API key in the sidebar before using AI features.")
                    return
                with st.spinner("Summarizing your textbook..."):
                    try:
                        client = get_api_client(api_key)
                        prompt = create_pdf_summary_prompt(summary_depth, raw_text)
                        response = client.responses.create(
                            model="gpt-4o-mini",
                            input=prompt,
                            temperature=0.5,
                            max_output_tokens=800,
                        )
                        summary_text = extract_text_from_response(response)
                        st.markdown("### Summary Result")
                        st.markdown(summary_text)
                    except Exception as err:
                        st.error(f"AI request failed: {err}")
        except RuntimeError as err:
            st.error(err)
    else:
        st.info("Upload a PDF file to begin extracting and summarizing the text.")


def show_assignment_help_page(api_key: str):
    st.header("📝 Assignment Help & Homework Solver")
    st.markdown(
        "Paste a homework question, essay prompt, or math problem and let the AI tutor explain it step-by-step."
    )

    question = st.text_area(
        "Paste your question or prompt here",
        height=200,
        placeholder="e.g. Explain photosynthesis, solve an algebra problem, or outline my essay structure.",
    )
    context_file = st.file_uploader(
        "Optional rubric or context document",
        type=["pdf", "txt"],
        help="Include extra information such as assignment rubrics or reference notes.",
    )

    if st.button("Ask your tutor 🧠"):
        if not question.strip():
            st.warning("Please paste a question or prompt to receive tutoring help.")
            return
        if not api_key:
            st.warning("Enter your OpenAI API key in the sidebar before using AI features.")
            return

        context_text = ""
        if context_file is not None:
            try:
                if context_file.type == "application/pdf":
                    context_text = safe_pdf_text(context_file)
                elif context_file.type.startswith("text"):
                    raw_text = context_file.read()
                    context_text = raw_text.decode("utf-8", errors="ignore")
                else:
                    context_text = ""
            except RuntimeError as err:
                st.error(err)
                return

        with st.spinner("Preparing your tutor response..."):
            try:
                client = get_api_client(api_key)
                prompt = create_assignment_prompt(question.strip(), context_text.strip())
                response = client.responses.create(
                    model="gpt-4o-mini",
                    input=prompt,
                    temperature=0.65,
                    max_output_tokens=900,
                )
                tutor_answer = extract_text_from_response(response)
                st.markdown("### Tutor Explanation")
                st.markdown(tutor_answer)
            except Exception as err:
                st.error(f"AI request failed: {err}")


def main():
    st.sidebar.title("EduHub 🎓")
    st.sidebar.markdown(
        "A student dashboard for organizing classes, summarizing textbooks, and getting friendly AI tutoring."
    )

    api_key = st.sidebar.text_input(
        "OpenAI API Key",
        type="password",
        placeholder="sk-...",
        help="Enter your OpenAI API key to enable AI features.",
    ).strip()

    st.sidebar.markdown("---")
    page = st.sidebar.radio("Choose a page", PAGE_OPTIONS)
    st.sidebar.markdown("---")
    st.sidebar.markdown(
        "Need help? Use the sidebar to enter your API key, then switch pages for timetable, summarizer, or assignment help."
    )

    init_session_state()

    if page == PAGE_OPTIONS[0]:
        show_timetable_page(api_key)
    elif page == PAGE_OPTIONS[1]:
        show_pdf_summary_page(api_key)
    elif page == PAGE_OPTIONS[2]:
        show_assignment_help_page(api_key)


if __name__ == "__main__":
    main()

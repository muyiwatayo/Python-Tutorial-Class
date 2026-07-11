import streamlit as st


def show_signup_page():
    st.title("Create your EduHub account")
    st.markdown(
        "Sign up to unlock your student productivity dashboard and AI study assistant. "
        "This demo app stores your session data locally in your browser and uses your OpenAI API key securely in the sidebar."
    )

    with st.form("signup_form"):
        full_name = st.text_input("Full Name")
        email = st.text_input("Email Address")
        school = st.text_input("School / Class")
        password = st.text_input("Create a password", type="password")
        password_confirm = st.text_input("Confirm password", type="password")
        submitted = st.form_submit_button("Sign up")

        if submitted:
            if not full_name or not email or not password:
                st.warning("Please fill in your name, email, and password to continue.")
            elif password != password_confirm:
                st.error("Passwords do not match. Please try again.")
            else:
                st.success("Signup complete! You can now go to the EduHub app.")
                st.info("This demo application does not store real user accounts. Use the EduHub app directly with your API key.")
                st.write("- Full Name:", full_name)
                st.write("- Email:", email)
                st.write("- School:", school)

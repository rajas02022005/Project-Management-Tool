import { FaSearch, FaBell, FaSignOutAlt, FaTimes } from "react-icons/fa";
import { useState, useEffect } from "react";
import Toast from "../Toast";

export default function Navbar({ colors, sidebarOpen, setSidebarOpen, isDarkMode, userEmail }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const handleLogout = async () => {
    try {
      // Clear user-specific data from localStorage
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userRole");
      
      // Show success message
      setToastMessage("Logged out successfully! Redirecting...");
      setToastType("success");
      setShowToast(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
      
    } catch (error) {
      console.error("Error during logout:", error);
      setToastMessage("Error during logout");
      setToastType("error");
      setShowToast(true);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {showToast && (
        <Toast 
          message={toastMessage} 
          type={toastType} 
          onClose={() => setShowToast(false)}
        />
      )}

      {/* About Us Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${colors.cardBg} rounded-lg p-6 w-full max-w-md`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${colors.text}`}>About Us</h2>
              <button 
                onClick={() => setShowAboutModal(false)} 
                className={`${colors.text} hover:text-gray-500`}
              >
                <FaTimes />
              </button>
            </div>
            <div className={`${colors.text} space-y-4`}>
              <p>
                Welcome to our Project Management Tool, designed to help educators and students collaborate effectively on academic projects.
              </p>
              <p>
                Our platform provides features for project creation, task management, progress tracking, and grading - all in one place.
              </p>
              <p className="font-semibold">
               
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contact Us Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${colors.cardBg} rounded-lg p-6 w-full max-w-md`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${colors.text}`}>Contact Us</h2>
              <button 
                onClick={() => setShowContactModal(false)} 
                className={`${colors.text} hover:text-gray-500`}
              >
                <FaTimes />
              </button>
            </div>
            <div className={`${colors.text} space-y-4`}>
              <p>
                Have questions or need support? Reach out to our team:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Email: <a href="mailto:support@projecttool.edu" className="text-blue-500 hover:underline">support@projecttool.edu</a></li>
                <li>Phone: xxxxxxxxxx</li>
              </ul>
              <p className="pt-4">
                For technical issues, please include:
                <br />
                - Your user email
                <br />
                - Description of the problem
                <br />
                - Screenshots if possible
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className={`${colors.navbar} fixed top-0 right-0 left-0 p-4 flex items-center justify-between shadow-md z-20 h-16`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="text-2xl text-white focus:outline-none"
          >
            ☰
          </button>
          <span className="text-xl font-bold text-purple-700">Project Management Tool</span>
          <div className="flex items-center gap-4 ml-8">
            <button 
              onClick={() => setShowAboutModal(true)} 
              className="text-white hover:text-gray-100"
            >
              About Us
            </button>
            <button 
              onClick={() => setShowContactModal(true)} 
              className="text-white hover:text-gray-100"
            >
              Contact Us
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {userEmail && (
            <span className="text-gray-300 font-medium">📧 {userEmail}</span>
          )}

          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 text-red-400 hover:text-red-300"
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </nav>
    </>
  );
}
# Open Pixel Archive

## Project Description

Open Pixel Archive is a project dedicated to providing a free and open platform for storing and sharing digital media. Our goal is to create a decentralized archive where users can upload their images, videos, audio files, and other media, and easily access and share them using direct links. This allows for seamless integration of media into various projects, websites, or for simply sharing files with others without limitations.

## Features

*   **Free Media Storage:** Store your digital media files without cost.
*   **Direct Linking:** Easily generate and use direct links to your uploaded files for embedding or sharing.
*   **File Sharing:** Share your media files with individuals or the public.
*   **Comprehensive File Management:** Organize, archive, and favorite your media files for easy access and retrieval.
*   **Support for Various Media Types:** Upload and manage images, videos, audio, and more.
*   **Dedicated Sections:** Explore specific sections for About, Archive, Donate, and Favorites.
*   **Robust API Endpoints:** Programmatic access for file uploads, archiving, moving to gallery, and general file operations.
*   **Theme Toggle (Dark/Light Mode):** Switch between dark and light themes for a personalized viewing experience.
*   **Modular UI Components:** Built with reusable components for easy development and maintenance.
*   **IP Address Logging:** For security and auditing purposes, the uploader's IP address is logged with each file upload.
*   **Community-Driven:** A platform built and maintained with community contributions.

## Installation

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (version 18 or higher recommended)
*   npm (comes with Node.js)
*   Git

### Steps

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/open-pixel-archive.git
    ```
    (Replace `https://github.com/your-username/open-pixel-archive.git` with the actual repository URL)
2.  Navigate to the project directory:
    ```bash
    cd open-pixel-archive
    ```
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Run the development server:
    ```bash
    npm run dev
    ```
    The application should now be running at `http://localhost:3000`.

## Usage

1.  **Access the Application:** Once the development server is running (as described in the Installation section), open your web browser and navigate to `http://localhost:3000`.
2.  **Upload Files:** Use the drag-and-drop area or click to select files for upload. You can upload various media types, including images, videos, audio, pdf, txt ect.
3.  **Add Preview Images (Optional):** For audio and video files, you have the option to add a preview image during the upload process.
4.  **Gallery Preference:** Choose whether to add the uploaded files to your gallery. This preference is saved for future uploads.
5.  **Access and Share:** After successful upload, files are stored locally in the `public/uploads` directory and can be accessed via direct links (e.g., `http://localhost:3000/uploads/your-file-name.jpg`). The application interface should provide a way to view uploaded files and get their links.
6.  **Manage Files:** Utilize the archive and favorites features to organize your uploaded content.
7.  **Toggle Theme:** Switch between dark and light modes using the theme toggle button in the application interface.

## Contributing

We welcome contributions to the Open Pixel Archive project! If you'd like to contribute, please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix.
3.  Make your changes and ensure they are well-tested.
4.  Commit your changes with clear and concise messages.
5.  Push your changes to your fork.
6.  Submit a pull request to the main repository.

Please see our `CONTRIBUTING.md` file [Link to CONTRIBUTING.md if it exists, otherwise remove or note it's TBD] for more details.

## License

This project is licensed under the [Specify your license, e.g., MIT License]. See the `LICENSE` file [Link to LICENSE file if it exists, otherwise remove or note it's TBD] for more information.

## Contact

If you have any questions or suggestions, please feel free to contact us at [Provide contact information or a link to a discussion forum/issue tracker].

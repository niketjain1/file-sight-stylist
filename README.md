# File-Sight Stylist - Document Extraction Application

## Project info

This application integrates with LandingAI's Document Extraction API to extract structured information from visually complex documents with text, tables, pictures, charts, and other information.

## Architecture

The project is split into two parts:

1. Frontend (React application in this directory)
2. Backend (Express server in the parent directory `/backend`)

## API Setup Instructions

1. You'll need a LandingAI API key to use this application.
2. Create a `.env` file in the root of the project with the following:

```
# API Configuration
VITE_LANDING_AI_API_KEY=your_api_key_here
```

3. Replace `your_api_key_here` with your actual API key.
4. Also set up the backend server with the same API key (see backend README).

## Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Install frontend dependencies
npm install

# Setup the backend (see backend directory README for details)
cd ../backend
npm install

# Create .env files with your API key as shown above

# Start the backend server
npm run dev

# In a separate terminal, start the frontend
cd ../file-sight-stylist
npm run dev
```

## Handling CORS Issues

CORS issues are handled by the backend server, which acts as a proxy between the frontend and the LandingAI API. Ensure the backend server is running whenever you use the application.

## Features

- Upload JPEG, PNG, and PDF files up to 250MB
- Extract structured information from documents
- Highlight extracted information with bounding boxes
- View extracted data in markdown and JSON formats
- Chat with documents to get additional insights
- Parse documents with high accuracy
- Download extracted content in markdown or JSON format

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/51905309-ef16-4af5-a831-19a20a254d4d) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

**Frontend:**

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- react-markdown (for rendering extracted content)

**Backend:**

- Express
- Node.js
- http-proxy-middleware (for API proxy)

## API Reference

This application integrates with the LandingAI Document Extraction API which:

- Extracts structured information from visually complex documents
- Returns data in a hierarchical format
- Pinpoints the exact location of each element
- Supports JPEG, PNG, and PDF files
- Handles documents with text, tables, pictures, charts, etc.

Maximum file size: 250MB
Maximum pages for PDF: 50

## Usage

1. Start the backend server (`cd ../backend && npm run dev`)
2. Start the frontend (`npm run dev`)
3. Upload a document by dragging and dropping or selecting a file
4. The application will process the document using the LandingAI API
5. Once processed, you'll see highlighted regions on the document
6. Click on highlighted regions to see the extracted content
7. Use the "Parse Document" button to process complex documents
8. Use "Chat with Document" to ask questions about the content
9. Download the extracted content as markdown or JSON

## How can I deploy this project?

For the frontend, open [Lovable](https://lovable.dev/projects/51905309-ef16-4af5-a831-19a20a254d4d) and click on Share -> Publish.

For the backend, you'll need to deploy it separately to a Node.js hosting platform such as:

- Heroku
- Vercel
- Railway
- AWS EC2
- Google Cloud Run

Remember to update the frontend's API URL to point to your deployed backend.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

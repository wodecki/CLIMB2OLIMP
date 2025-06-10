# Managerial Problem Solver Frontend

This is a modern Next.js frontend for the Managerial Problem Solver application. It provides a user-friendly interface for filling out the questionnaire that feeds into the backend multi-agent system.

## Features

- Modern, responsive UI built with Next.js and Tailwind CSS
- Interactive questionnaire with progress tracking
- Category-based navigation for easy questionnaire completion
- Seamless integration with the backend multi-agent system
- Real-time validation and feedback

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Backend server set up and running

### Installation

1. Clone the repository (if you haven't already)
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Running the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Building for Production

```bash
npm run build
# or
yarn build
```

Then, to start the production server:

```bash
npm run start
# or
yarn start
```

## Project Structure

- `src/app/` - Next.js app router pages and API routes
- `src/components/` - React components used throughout the application
- `src/types/` - TypeScript type definitions
- `src/middleware/` - Server-side middleware functions
- `src/utils/` - Utility functions

## Key Components

- `QuestionItem.tsx` - Renders a single question with its options
- `CategorySection.tsx` - Renders all questions for a specific category
- `CategoryNavigation.tsx` - Provides navigation between different categories

## API Routes

- `GET /api/questionnaire` - Fetches the questionnaire data from the backend
- `POST /api/questionnaire` - Saves the completed questionnaire to the backend

## Integration with Backend

The frontend reads the questionnaire data from `backend/data/all_questions.json` and saves the answers to `backend/data/answer_1.json` and `backend/data/answer_1.txt`. These files are then used by the backend multi-agent system to generate the analysis and recommendations.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m "Add a new feature"`
4. Push to the branch: `git push origin feature-name`
5. Open a pull request

## License

This project is licensed under the MIT License.

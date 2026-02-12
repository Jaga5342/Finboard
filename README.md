
# FinBoard - Customizable Finance Dashboard

A powerful, customizable finance dashboard built with Next.js, allowing users to track real-time financial data through widgets.

## Features

- **Customizabe Widgets**: Create Chart, Table, or Card widgets connected to any JSON API.
- **Drag-and-Drop Grid**: Arrange your dashboard exactly how you want it.
- **Real-time Data**: Automatic refreshing with configurable intervals.
- **Theme support**: Switch between Dark and Light modes.
- **Persistence**: Your layout and configuration are saved automatically.
- **Export/Import**: Backup your dashboard configuration to a JSON file.
- **Responsive**: Works on Mobile, Tablet, and Desktop.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **State Management**: Zustand (with Persist middleware)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Grid Layout**: React Grid Layout
- **Http Client**: Axios

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
   ```bash
   npm run dev
   ```

3. **Open in Browser**
   Navigate to [http://localhost:3000](http://localhost:3000).

## How to Use

1. **Add a Widget**:
   - Click the "Add Widget" button.
   - Enter a name (e.g., "Bitcoin Price").
   - Enter an API URL (e.g., `https://api.coinbase.com/v2/prices/BTC-USD/spot`).
   - Click "Test" to verify the API.
   - Select the fields you want to display from the JSON explorer.
   - Choose a visualization type (Card, Table, Chart).
   - Click "Add Widget".

2. **Manage Widgets**:
   - **Move**: Drag the widget handle (top-left grip icon) to rearrange.
   - **Resize**: Drag the bottom-right corner to resize.
   - **Refresh**: Click the refresh icon to manually fetch data.
   - **Delete**: Click the trash icon to remove a widget.

3. **Export/Import**:
   - Use the buttons in the header to save your setup or load a config file.

## Design Decisions

- **Client-Side Fetching**: Widgets fetch data directly from the client to allow users to connect to any API without proxying, though CORS restrictions apply.
- **Zustand**: Chosen for its simplicity and ease of persisting deeply nested state objects like dashboard layouts.
- **Tailwind**: Used for rapid, scalable styling with dark mode support.


--We build the project for Everyone to solve their problem and make helpful.
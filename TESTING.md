
# Testing Guide

This guide will help you manually verify all the key features of the Finance Dashboard application.

## Prerequisites

- Ensure the application is running (`npm run dev`).
- Open your browser to `http://localhost:3000`.

## 1. Widget Creation (Core Feature)

**Scenario**: Add a Bitcoin Price Tracker.

1.  Click the "Add Widget" button in the top right.
2.  **Name**: Enter `Bitcoin Price`.
3.  **API URL**: Enter `https://api.coinbase.com/v2/prices/BTC-USD/spot`.
4.  **Test**: Click the `Test` button.
    - *Expected*: You should see a green success message found `X` fields.
    - *Expected*: A "Select Fields" section should appear.
5.  **Select Fields**:
    - Search for `amount`.
    - Click the `+` button next to `data.amount`.
    - Rename the field "Price (USD)" if you like.
6.  **Display Mode**: Select `Card`.
7.  **Submit**: Click "Add Widget".
    - *Expected*: A new card widget appears on the dashboard showing the Bitcoin price.

**Variations to try**:
- Select `Table` mode with an API that returns a list (e.g., `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false`).
- Select `Chart` mode (Note: ensure your API returns historical time-series data or the chart will be empty/static).

## 2. Grid Management

**Scenario**: Organize your dashboard.

1.  **Move**: Grab the "Grip" icon (dots) on top-left of any widget and drag it to a new location.
2.  **Resize**: (Desktop only) Grab the bottom-right corner of a widget and drag to resizing it.
    - *Expected*: The surrounding widgets should reflow automatically.

## 3. Data Persistence

**Scenario**: Verify your setup is saved.

1.  Add a widget and move it to a specific spot.
2.  **Refresh** the browser page (`F5` or `Cmd+R`).
    - *Expected*: The widget should still be there, in the exact same position.
    - *Expected*: Data should automatically refresh shortly after load.

## 4. Export & Import

**Scenario**: Backup your configuration.

1.  Click the **Export** button in the header.
    - *Expected*: A JSON file is downloaded.
    - *Expected*: A green "Success" toast notification appears.
2.  **Delete** all widgets from your dashboard using the Trash icon on each widget.
3.  Click the **Import** button and select the file you just downloaded.
    - *Expected*: All your original widgets reappear instantly.

## 5. Mobile Responsiveness

**Scenario**: Test on a small screen.

1.  Open Developer Tools (`F12` or Right Click > Inspect).
2.  Toggle Device Toolbar (Mobile view).
3.  Select "iPhone SE" or resize width to < 768px.
    - *Expected*: The grid layout changes to a single column.
    - *Expected*: Widgets expand to fill the width.
    - *Expected*: The "Add Widget" modal becomes full-screen.

## 6. Error Handling

**Scenario**: Handle broken APIs.

1.  Add a Widget.
2.  Enter an invalid URL: `https://api.invalid-url-test.com/data`.
3.  Click `Test`.
    - *Expected*: An error message appears in red explaining the failure.
4.  Alternatively, create a widget with a working URL, then disconnect your internet and click the widget's "Refresh" icon.
    - *Expected*: The widget shows a red error state with a "Retry" button.

## 7. Configuration (Edit)

*Note: Currently, clicking the Settings (Cog) icon on a widget re-opens the "Add Widget" modal. This is a placeholder for future "Edit Existing" functionality.*

---

**Happy Testing!** 🚀

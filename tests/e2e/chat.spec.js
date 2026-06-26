import { test, expect } from '@playwright/test';

test.describe('AI Chat E2E Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Add init script to mock SpeechRecognition
    await page.context().addInitScript(() => {
      const MockSpeech = class {
        constructor() {
          this.continuous = false;
          this.interimResults = false;
        }
        start() {
          if (this.onstart) this.onstart();
          setTimeout(() => {
            if (this.onresult) {
              const event = {
                results: [[{ transcript: 'test voice query' }]]
              };
              this.onresult(event);
            }
            if (this.onend) this.onend();
          }, 100);
        }
        stop() {
          if (this.onend) this.onend();
        }
      };
      window.SpeechRecognition = MockSpeech;
      window.webkitSpeechRecognition = MockSpeech;
    });
    await page.goto('/');
  });

  test('should display greeting message and start a chat session', async ({ page }) => {
    const chatContainer = page.locator('main');
    await expect(chatContainer).toBeVisible();

    // Check greeting message contains product intelligence info
    await expect(page.locator('text=Product Intelligence').filter({ visible: true }).first()).toBeVisible();
    await expect(page.locator('text=How can I help you today').filter({ visible: true }).first()).toBeVisible();
  });

  test('should support voice dictation button rendering and toggling', async ({ page }) => {
    const micButton = page.locator('button[title="Start Voice Input"]');
    await expect(micButton).toBeVisible();
    await expect(micButton).toHaveText('🎙️');

    await micButton.click();

    const textarea = page.locator('textarea');
    await expect(textarea).toHaveValue(/test voice query/i);
  });

  test('should submit message and receive streamed response', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('Tell me about HP OmniBook Ultra Flip 14');
    
    const sendButton = page.locator('button:has-text("➤")');
    await sendButton.click();

    // Verify that the product image card with caption is displayed
    await expect(page.locator('text=HP OmniBook Ultra Flip 14').filter({ visible: true }).last()).toBeVisible({ timeout: 15000 });
  });

  test('should toggle the chat history sidebar correctly', async ({ page }) => {
    const historyButton = page.locator('button:has-text("Chat History")');
    await expect(historyButton).toBeVisible();

    await historyButton.click();

    const drawerTitle = page.locator('h3:has-text("Chat History")');
    await expect(drawerTitle).toBeVisible();

    const closeButton = page.locator('button:has-text("✕")');
    await closeButton.click();
    await expect(drawerTitle).not.toBeVisible();
  });

  test('should navigate to Sales Coach role-play and start a negotiation', async ({ page }) => {
    // Click the Sales Coach nav tab (handles desktop header or mobile bottom bar)
    const salesCoachTab = page.locator('button[title="Sales Coach"], button[aria-label="Sales Coach"]').filter({ visible: true }).first();
    await expect(salesCoachTab).toBeVisible();
    await salesCoachTab.click();
    
    // Verify we are on the Sales Coach page
    await expect(page.locator('h1:has-text("Sales Coach")')).toBeVisible();
    
    // Click the Role-play tab
    const roleplayTab = page.locator('button:has-text("Role-play")').first();
    await expect(roleplayTab).toBeVisible();
    await roleplayTab.click();
    
    // Verify the persona selector is shown
    await expect(page.locator('text=Sales Objection Role-play Practice')).toBeVisible();
    await expect(page.locator('text=Karan Malhotra')).toBeVisible();
    
    // Start negotiation with Karan Malhotra
    const startButton = page.locator('button:has-text("Start Negotiation")').first();
    await expect(startButton).toBeVisible();
    await page.waitForTimeout(500); // wait for fadeUp animation to finish
    await startButton.click();
    
    // Verify we transitioned to the chat room by waiting for the input field
    const input = page.locator('input[type="text"]').first();
    await expect(input).toBeVisible({ timeout: 10000 });
    
    // Verify the buyer name is visible in the chat room header
    await expect(page.locator('h4:has-text("Karan Malhotra")').first()).toBeVisible();
    
    // Check that send button exists
    const sendButton = page.locator('button:has-text("➤")').first();
    await expect(sendButton).toBeVisible();
  });
});

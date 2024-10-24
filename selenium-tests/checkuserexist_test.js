import { Builder, By, Key, until } from "selenium-webdriver";
import { Options } from "selenium-webdriver/chrome.js";
import assert from "assert";
import { join } from "path";
import pixelmatch from 'pixelmatch';
import PNG from 'pngjs';
import fs from 'fs';
import path from 'path';

describe("Check user exist page Test", function () {
  let driver;

  before(async function () {
    // Create screenshots directory if it doesn't exist
    const screenshotDir = join( process.cwd(), "./screenshots");
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir);
    }
  });

  beforeEach(async function () {
    const options = new Options();
    options.addArguments("--start-maximized");

    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

    await driver.manage().setTimeouts({ implicit: 10000 });
  });

  afterEach(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  it("Snapshot testing checkuserexist page", async function () {
    try {
      await driver.get("https://demo.wrappid.dev/defaultAppRoute");
      await driver.sleep(1000);

      // Wait for button to be present
      await driver.wait(
        until.elementLocated(
          By.xpath(
            "//button[contains(@class, 'MuiButton-contained') and text()='Login']"
          )
        ),
        10000,
        "Login button not found"
      );

      // Wait for button to be clickable
      const loginButton = await driver.wait(
        until.elementIsEnabled(
          await driver.findElement(
            By.xpath(
              "//button[contains(@class, 'MuiButton-contained') and text()='Login']"
            )
          )
        ),
        5000,
        "Login button not clickable"
      );

      // Add a small wait for any animations
      await driver.sleep(500);

      // Click the button
      await loginButton.click();

      // Wait for the load the page 
      await driver.sleep(1000);
      const screenshot = await driver.takeScreenshot();
    
      // Store the new screenshot
      fs.writeFileSync(
        path.join( process.cwd(), "./screenshots/new-snapshot.png"),
        screenshot,
        "base64"
      );
    
      // Call compare function
      // Compare local snapshot with new snashot
     const { passed, diffPixels } = await compareWithSnapshot( "old.png", "new-snapshot.png" )
     // Assert that the images are the same 
     assert.ok(passed, `Images are different by ${diffPixels} pixels`);
    } catch (error) {
      console.error("Test failed:", error);
      throw error;
    }
  });
});



    /**
     * Compare local snapshot with new snashot
     * @param localSnapshot 
     * @param currentScreenshot 
     * @returns 
     */
    async function compareWithSnapshot(localSnapshot, newSnapshot) {
        const snapshotPath = path.join( process.cwd(),  `./old/${localSnapshot}`);
        const currentScreenshot = path.join( process.cwd(),  `./screenshots/${newSnapshot}`);
        
        try {
            const existingSnapshot = await fs.readFileSync(snapshotPath);
            const new1 = await fs.readFileSync(currentScreenshot);
            const img1 = PNG.PNG.sync.read(existingSnapshot);
            const img2 = PNG.PNG.sync.read(new1);
            
            const { width, height } = img1;
            const diff = new PNG.PNG({ width, height });
            
            const numDiffPixels = pixelmatch(
                img1.data,
                img2.data,
                diff.data,
                width,
                height,
                { threshold: 0.1 }
            );
            
            // Save diff image if there are differences
            if (numDiffPixels > 0) {
              fs.writeFileSync(
                path.join(process.cwd(), `diff.png`),
                    PNG.PNG.sync.write(diff)
                );
            }
            
            return {
                passed: numDiffPixels === 0,
                diffPixels: numDiffPixels
            };
        } catch (error) {
            if (error.code === 'ENOENT') {
                // Snapshot doesn't exist yet, save current as new snapshot
                await fs.writeFile(snapshotPath, currentScreenshot);
                return { passed: true, newSnapshot: true };
            }
            throw error;
        }
    }

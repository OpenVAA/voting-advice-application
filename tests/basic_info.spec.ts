import { test, expect } from "@playwright/test";
import path from "path";

test.beforeEach(async ({ page, baseURL }) => {
	await page.goto(`${baseURL}/en/candidate/profile`);
});

test("should succesfully set basic info", async ({ page }) => {
	await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/en\/candidate\/profile/);
	const saveButton = page.getByRole("button", { name: "Save and Return" });
	page.on("filechooser", async (fileChooser) => {
		await fileChooser.setFiles(path.join(__dirname, "test_image_black.png"));
	});
	await page.locator("#portraitLabel").click();
	await page.getByLabel("Finnish").click();
	await expect(saveButton).toBeDisabled();
	await page.getByLabel("Select first").selectOption("fi");
	await page.getByLabel("Add another").selectOption("en");
	await expect(
		page.locator("form div").filter({ hasText: "Finnish" }).nth(3)
	).toBeVisible();
	await expect(
		page.locator("form div").filter({ hasText: "English" }).nth(3)
	).toBeVisible();
	await page.getByLabel("English").click();
	await expect(saveButton).toBeVisible();
	await saveButton.click();
	await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/en\/candidate/);
});

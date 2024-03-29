import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/en/candidate`);
});

test("should log out", async ({ page }) => {
  await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/en\/candidate/);

  await page.getByTitle("Logout").click();

  //TODO: handle logout dialog
  // await expect(
  //   page.getByText("Some of Your Data Is Still Missing")
  // ).toBeVisible();
  // await expect(page.getByText("Continue Entering Data")).toBeVisible();

  // const logoutButton = page
  //   .getByRole("dialog")
  //   .getByRole("button", { name: "Logout" });
  // await expect(logoutButton).toBeVisible();
  // await logoutButton.click();

  // await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/en\/candidate/);
  // await expect(page.getByText("Sign in")).toBeVisible();
});

test("should navigate", async ({ page }) => {
  await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/en\/candidate/);
  await expect(
    page.getByRole("button", { name: "Close menu" })
  ).not.toBeVisible();
  await page.getByLabel("Open menu").click();
  await expect(page.getByRole("button", { name: "Close menu" })).toBeVisible();
  await page.getByRole("link", { name: "Basic Info" }).click();
  await expect(page).toHaveURL(/(http[s]?:\/\/)?(.*)\/en\/candidate\/profile/);
  await expect(
    page.getByRole("button", { name: "Close menu" })
  ).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Basic Information" })
  ).toBeVisible();
});

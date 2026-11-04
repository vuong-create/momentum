import {test,expect} from "@playwright/test";

test("a daily habit flows from Planner through Home to the pixel calendar",async({page},testInfo)=>{
  await page.clock.install({time:new Date("2026-11-04T12:00:00-05:00")});
  await page.goto("/planner");
  await page.getByRole("button",{name:"Habits",exact:true}).click();
  await page.getByRole("button",{name:"+ New habit"}).click();
  await page.getByLabel("Habit name").fill("Read ten pages");
  await page.getByLabel("Start date").fill("2026-11-02");
  await page.getByRole("button",{name:"Save schedule"}).click();
  await expect(page.getByText("Habit schedule saved.")).toBeVisible();
  await page.goto("/");
  await expect(page.locator(".home-unfinished-item")).toHaveCount(0);
  await page.getByRole("button",{name:"Complete Read ten pages",exact:true}).click();
  await page.getByRole("link",{name:"View history"}).click();
  await page.getByRole("combobox",{name:"Map",exact:true}).selectOption({label:"Read ten pages"});
  await expect(page.getByRole("button",{name:"2026-11-04 · Done",exact:true})).toBeVisible();
  await page.getByRole("button",{name:"2026-11-03 · Scheduled, not logged"}).click();
  await page.getByRole("button",{name:"Log for Nov 3"}).click();
  await expect(page.getByRole("button",{name:"2026-11-03 · Done"})).toBeVisible();
  await page.screenshot({path:testInfo.outputPath("pixel-calendar.png"),animations:"disabled"});
  await page.getByLabel("Range").selectOption("53");
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

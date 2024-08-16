import { describe, expect, test } from "vitest"
import { PlayerClient } from "../index"
import { createPlayerClient } from "../index";

describe("Test", () => {
    //test.todo("Write more tests!");

    test("Test PlayerClient", async () => {

        const playerClient = createPlayerClient();

        //expect(playerClient).toBeDefined()
        expect(playerClient).toBeInstanceOf(PlayerClient)

        expect(await playerClient.isPreviewMode()).toBe(true)
    });
})
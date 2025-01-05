
export enum PageId {
    "BENCHMARK",
    "BOTVIEWER",
    "USERPLAY",
    "EDITOR"
}

export const getPageTitle = (pageId: PageId): string => {
    if (pageId == PageId.BENCHMARK) {
        return "Bot Benchmarking"
    } else if (pageId == PageId.BOTVIEWER) {
        return "Bot View"
    } else if (pageId == PageId.EDITOR) {
        return "Board Editor"
    } else if (pageId == PageId.USERPLAY) {
        return "User Play"
    } else {
        return "Home"
    }
}

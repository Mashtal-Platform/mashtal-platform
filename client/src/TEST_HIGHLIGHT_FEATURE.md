# Highlight Feature Test Scenarios

## Test Scenarios

### Scenario 1: Post Not Yet Loaded
**Setup**: 
- User is on Posts page
- User has scrolled through first 10 posts (visiblePosts = 10)
- User receives notification for post with ID 'p25' (beyond visible range)

**Action**:
- Click notification
- Navigate to posts page with `highlightPostId: 'p25'`

**Expected Result**:
- ✅ Post 'p25' appears at the top of the feed
- ✅ Post 'p25' has green border and highlight animation
- ✅ Page auto-scrolls to show post 'p25' near top
- ✅ Highlight disappears after 3 seconds
- ✅ Post 'p25' remains at top but without highlight

---

### Scenario 2: Post Already Visible
**Setup**:
- User is on Posts page  
- User has scrolled through 20 posts (visiblePosts = 20)
- Post 'p5' is visible in the feed at position 5

**Action**:
- User clicks on post 'p5' from their profile
- Navigate to posts page with `highlightPostId: 'p5'`

**Expected Result**:
- ✅ Post 'p5' moves from position 5 to position 1 (top)
- ✅ Post 'p5' has green border and highlight animation
- ✅ Page auto-scrolls to show post 'p5' at top
- ✅ Highlight disappears after 3 seconds
- ✅ No duplicate posts in feed

---

### Scenario 3: Post Doesn't Exist
**Setup**:
- User is on Posts page
- Post with ID 'p999' doesn't exist in data

**Action**:
- Navigate to posts page with `highlightPostId: 'p999'`

**Expected Result**:
- ✅ Normal feed displays without errors
- ✅ No highlight effect
- ✅ No console errors
- ✅ User can browse normally

---

### Scenario 4: Thread from Notification
**Setup**:
- User receives notification about mention in thread 't10'
- Thread 't10' is not yet loaded (beyond visible range)

**Action**:
- Click notification
- Navigate to threads page with `highlightThreadId: 't10'`

**Expected Result**:
- ✅ Thread 't10' appears at top of feed
- ✅ Thread 't10' has green border and highlight animation  
- ✅ Page auto-scrolls to center thread 't10'
- ✅ Highlight disappears after 3 seconds
- ✅ Thread 't10' remains at top

---

### Scenario 5: Navigate Away and Back
**Setup**:
- User views highlighted post 'p15'
- Post is highlighted and at top

**Action**:
- Navigate to Shopping page
- Navigate back to Posts page (without highlight param)

**Expected Result**:
- ✅ Post 'p15' is no longer highlighted
- ✅ Feed shows normal order
- ✅ No highlight effect
- ✅ highlightPostId is cleared

---

### Scenario 6: Multiple Rapid Clicks
**Setup**:
- User rapidly clicks multiple notifications
- Click notification for post 'p10'
- Immediately click notification for post 'p20'

**Action**:
- First click: Navigate with `highlightPostId: 'p10'`
- Second click: Navigate with `highlightPostId: 'p20'`

**Expected Result**:
- ✅ Only post 'p20' is highlighted (latest)
- ✅ Previous highlight for 'p10' is cleared
- ✅ Post 'p20' appears at top with highlight
- ✅ No visual glitches or errors

---

### Scenario 7: Post Already at Top
**Setup**:
- Most recent post 'p1' is at position 1 in feed
- User scrolled through first 5 posts

**Action**:
- Click notification for post 'p1'
- Navigate with `highlightPostId: 'p1'`

**Expected Result**:
- ✅ Post 'p1' remains at position 1
- ✅ Post 'p1' gets highlighted
- ✅ Minimal/no scrolling needed
- ✅ Highlight works correctly

---

### Scenario 8: From Profile Grid Click
**Setup**:
- User views Engineer profile page
- Engineer has 15 posts in their grid
- User clicks on post 'p12' in the grid

**Action**:
- Click post 'p12' thumbnail
- Navigate to posts page with `highlightPostId: 'p12'`

**Expected Result**:
- ✅ Post 'p12' appears at top of main feed
- ✅ Post shown in full context with all interactions
- ✅ Post has highlight animation
- ✅ User can see post in feed context, not just profile

---

## Visual Checklist

When a post/thread is highlighted, verify:
- [ ] Green border (`border-green-500`)
- [ ] Elevated shadow (`shadow-xl`)  
- [ ] Green ring effect (`ring-2 ring-green-200`)
- [ ] Subtle pulse animation
- [ ] Smooth scroll to item
- [ ] Highlight fades out after 3 seconds
- [ ] Item remains visible after highlight fades

## Performance Checklist

- [ ] No duplicate items in feed
- [ ] No unnecessary re-renders
- [ ] Smooth scroll animation
- [ ] Fast highlight activation (< 300ms)
- [ ] No memory leaks from timers
- [ ] Works on mobile and desktop

## Browser Console Checks

During testing, verify:
- [ ] No error messages
- [ ] No warning messages  
- [ ] No infinite loops
- [ ] Proper cleanup on unmount

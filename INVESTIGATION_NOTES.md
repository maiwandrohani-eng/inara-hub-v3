# 403 Forbidden Investigation Notes

## Observations

1. **Working Endpoint:**
   - `/api/admin/check-role` - Returns 200, shows user as ADMIN
   - This endpoint is defined BEFORE `router.use(authorize(UserRole.ADMIN))` in admin.ts
   - Only requires `authenticate`, not `authorize`

2. **Failing Endpoints:**
   - `/api/analytics/people` - Returns 403 "Forbidden" (plain text, not JSON)
   - `/api/analytics/compliance` - Returns 403 "Forbidden"
   - `/api/analytics/system-usage` - Returns 403 "Forbidden"
   - `/api/templates` - Returns 403 "Forbidden"
   - `/api/admin/templates/bulk-import` - Returns 403 "Forbidden"

3. **Key Differences:**
   - All failing endpoints require both `authenticate` AND `authorize`
   - The response is plain "Forbidden" text with Vercel deployment ID
   - This suggests Vercel is blocking BEFORE the request reaches Express

4. **Possible Causes:**
   - **CORS Issue**: Vercel might be blocking based on origin
   - **Request Size**: Bulk import likely exceeds 4.5MB (but GET requests shouldn't)
   - **Routing Issue**: Vercel rewrite rules might not be working correctly
   - **Authorization Header**: Might not be reaching the backend for some routes
   - **Vercel Function Timeout/Memory**: But this would be 500, not 403

## Next Steps to Investigate

1. Check if Authorization header is being sent in Network tab
2. Compare working vs failing request headers
3. Check Vercel function logs to see if requests are reaching the handler
4. Test if the issue is specific to certain HTTP methods (GET vs POST)
5. Check if there's a difference in how routes are registered

## Hypothesis

The plain "Forbidden" response with Vercel deployment ID suggests:
- Vercel's platform is blocking the request
- This could be due to:
  1. CORS configuration mismatch
  2. Request routing issue (rewrite rules)
  3. Vercel security/firewall rules
  4. Missing or malformed Authorization header (but check-role works, so unlikely)

## Test Plan

1. Add logging to Vercel handler to see if requests arrive
2. Check Network tab Headers for Authorization header
3. Compare request headers between working and failing requests
4. Test with curl/Postman to bypass browser CORS
5. Check Vercel dashboard for function logs

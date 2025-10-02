# Webhook Integration Guide

## n8n & Firecrawl Integration for Custom Pool Pros Permit Lookup

This application provides webhook endpoints for easy integration with n8n automation workflows and Firecrawl web scraping.

## Available Webhook Endpoints

### 1. Single Lead Submission
**Endpoint:** `POST /webhook/n8n/leads`

Submit a single permit lead to the database.

**Request Body:**
```json
{
  "source": "monmouth-county-permits",
  "kind": "permit",
  "permitNumber": "P2024-001234",
  "issueDate": "2024-10-01",
  "status": "ISSUED",
  "permitType": "Single Family Dwelling",
  "rawAddress": "123 Main Street, Freehold, NJ 07728",
  "street": "123 Main Street",
  "city": "Freehold",
  "state": "NJ",
  "zip": "07728",
  "county": "Monmouth",
  "town": "Freehold",
  "contractorName": "ABC Builders LLC",
  "estValue": 450000,
  "lotAcres": 0.5,
  "notes": "New construction",
  "tags": ["new-construction", "pool-candidate"]
}
```

**Response:**
```json
{
  "success": true,
  "action": "created",
  "id": "uuid-here"
}
```

### 2. Batch Lead Submission
**Endpoint:** `POST /webhook/n8n/batch`

Submit multiple leads in a single request.

**Request Body:**
```json
{
  "leads": [
    {
      "source": "ocean-county-permits",
      "rawAddress": "456 Oak Ave, Brick, NJ 08723",
      "street": "456 Oak Ave",
      "city": "Brick",
      "state": "NJ",
      "zip": "08723",
      "county": "Ocean",
      "town": "Brick"
    },
    {
      "source": "camden-county-permits",
      "rawAddress": "789 Pine St, Cherry Hill, NJ 08003",
      "street": "789 Pine St",
      "city": "Cherry Hill",
      "state": "NJ",
      "zip": "08003",
      "county": "Camden",
      "town": "Cherry Hill"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "processed": 2,
  "results": [
    { "action": "created", "id": "uuid-1" },
    { "action": "updated", "id": "uuid-2" }
  ]
}
```

### 3. Health Check
**Endpoint:** `GET /webhook/health`

Check if the webhook service is running.

**Response:**
```json
{
  "status": "ok",
  "service": "cpp-permit-lookup-webhooks",
  "timestamp": "2024-10-02T12:00:00.000Z"
}
```

## n8n Workflow Setup

### Example Workflow: Scrape County Website → Store in Database

1. **HTTP Request Node** (Firecrawl or Custom Scraper)
   - Method: POST
   - URL: https://api.firecrawl.dev/v0/scrape
   - Body: Configuration for target permit website

2. **Code Node** (Transform Data)
   ```javascript
   const permits = [];

   for (const item of $input.all()) {
     const data = item.json;

     permits.push({
       source: 'monmouth-county',
       rawAddress: data.address,
       street: data.streetAddress,
       city: data.city,
       state: 'NJ',
       zip: data.zipCode,
       county: 'Monmouth',
       permitNumber: data.permitNum,
       issueDate: data.date,
       status: data.status,
       contractorName: data.contractor,
       estValue: parseFloat(data.value)
     });
   }

   return [{ json: { leads: permits } }];
   ```

3. **HTTP Request Node** (Submit to Webhook)
   - Method: POST
   - URL: https://your-domain.com/webhook/n8n/batch
   - Body: {{ $json.leads }}
   - Headers:
     - Content-Type: application/json

## Firecrawl Integration

### Scraping Configuration Example

```javascript
{
  "url": "https://www.monmouthcountynj.gov/permits",
  "formats": ["markdown", "html"],
  "onlyMainContent": true,
  "waitFor": 2000,
  "extractorOptions": {
    "mode": "llm-extraction",
    "extractionPrompt": "Extract all building permit information including: permit number, address, issue date, status, permit type, contractor name, and estimated value"
  }
}
```

## Security Best Practices

1. **Use HTTPS**: Always use HTTPS in production
2. **API Authentication**: Consider adding API key authentication for production
3. **Rate Limiting**: Implement rate limiting on webhook endpoints
4. **Input Validation**: All inputs are validated using Zod schemas
5. **Error Handling**: Failed submissions are logged and returned with error messages

## Required Fields

Minimum required fields for a valid lead submission:
- `source` (string): Identifier for the data source
- `rawAddress` (string): Full address as scraped
- `street` (string): Parsed street address
- `city` (string): City name
- `state` (string): State abbreviation
- `zip` (string): ZIP code

## Optional Fields

- `kind`: 'permit' | 'builder' | 'assessor' | 'manual' (default: 'permit')
- `permitNumber`: Permit identification number
- `issueDate`: Date permit was issued (ISO format)
- `status`: Current permit status
- `permitType`: Type of permit
- `county`: County name
- `town`: Town/municipality name
- `parcelId`: Tax parcel identifier
- `ownerName`: Property owner name
- `contractorName`: Contractor name
- `estValue`: Estimated project value (number)
- `yearBuilt`: Year property was built (number)
- `lotAcres`: Lot size in acres (number)
- `lat`: Latitude coordinate (number)
- `lon`: Longitude coordinate (number)
- `notes`: Additional notes (string)
- `tags`: Array of tag strings

## Duplicate Detection

The system automatically detects duplicates using a canonical key based on:
- Street address
- City
- State
- ZIP code

When a duplicate is detected, the existing record is updated with new information while preserving the original `first_seen` timestamp.

## Testing

Test the webhook endpoint using curl:

```bash
curl -X POST https://your-domain.com/webhook/n8n/leads \
  -H "Content-Type: application/json" \
  -d '{
    "source": "test-source",
    "rawAddress": "123 Test St, Testville, NJ 12345",
    "street": "123 Test St",
    "city": "Testville",
    "state": "NJ",
    "zip": "12345"
  }'
```

## Support

For questions or issues with webhook integration:
- Check server logs for detailed error messages
- Verify all required fields are present in requests
- Ensure proper JSON formatting
- Use the `/webhook/health` endpoint to verify service availability

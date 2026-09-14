# Sillage Public API (v1.0.0)

API for accessing workspace signals and lead detection data. Authenticate using an API key provided in the Authorization header as a Bearer token.

---

## GET /v1/workspace/signals

**List workspace signals**

Returns a paginated list of lead detection signals for the authenticated workspace.

---

## What is a signal?

A **signal** is a buying intent event detected by Sillage.
Each signal is tied to a **lead** in your workspace and carries three top-level objects:

| Field    | Description                                                                                                       |
| -------- | ----------------------------------------------------------------------------------------------------------------- |
| `signal` | Metadata - unique ID, when the activity occurred, when Sillage detected it, and the event payload (`signal.data`) |
| `agent`  | The Sillage agent that detected the event (`id`, `name`, `agent_type`)                                            |

---

## Signal fields

| Field                   | Description                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `signal.id`             | Unique document ID of the signal (e.g. `n8ip5inzf8fgwi5ksrrdwy9i`)                                                                                      |
| `signal.signal_date`    | The date the underlying event occurred - e.g. when the post was published or the job change happened. This is the date of the real-world buying signal. |
| `signal.detection_date` | The date Sillage detected and processed this signal. This date is always ≥ `signal_date`.                                                               |
| `signal.signal_type`    | Interaction subtype in snake_case. Use `agent.agent_type` to determine the shape of `signal.data`.                                                      |

| Signal type                         | Description                                                                         |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| `linkedin_comment`                  | A lead commented on a competitor's post                                             |
| `linkedin_reaction`                 | A lead reacted to a competitor's post                                               |
| `keyword_detection`                 | A post matching tracked keywords was detected                                       |
| `lead_liked_competitor_content`     | A lead liked content from your own company                                          |
| `lead_commented_competitor_content` | A lead commented on content from your own company                                   |
| `lead_liked_influencer_content`     | A lead liked an influencer's post                                                   |
| `lead_commented_influencer_content` | A lead commented on an influencer's post                                            |
| `new_job`                           | A lead started a new job                                                            |
| `recently_promoted`                 | A lead was recently promoted                                                        |
| `deep_search`                       | A company-level signal detected by AI deep search (e.g. funding, hiring, expansion) |
| `job_posting`                       | A job posting matching tracked criteria was published by a target company           |

> **Example:** A lead comments on a competitor post on Monday (`signal_date = Monday`). Your Sillage campaign runs its nightly scan on Tuesday and picks it up (`detection_date = Tuesday`).

> **Default time window:** when you pass neither `signalStartDate` nor `detectionStartDate`, the endpoint returns only signals from the last **90 days** (by `signal_date`); signals without a `signal_date` are excluded. Pass an explicit `signalStartDate` to reach older signals.

---

## Agent fields

| Field              | Description                                                               |
| ------------------ | ------------------------------------------------------------------------- |
| `agent.id`         | Document ID of the agent that detected the signal                         |
| `agent.name`       | Human-readable display name of the agent (e.g. `"Competitors' Activity"`) |
| `agent.agent_type` | Agent category. Determines the shape of `signal.data`.                    |

| Agent type              | Agent name                | Trigger                                                                                                    | Signal data fields                                      |
| ----------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `competitor_activity`   | `"Competitors' Activity"` | A lead commented on or reacted to a **competitor's post**                                                  | `interaction` (`type`, `url`, `author`), `post`         |
| `keyword_detection`     | `"Keyword Detection"`     | A post matching your **tracked keywords** was detected                                                     | `post`, `keywords_found`                                |
| `job_update`            | `"Job Updates"`           | A lead **changed job** or was recently promoted                                                            | `previous_position`, `new_position`                     |
| `content_engagement`    | `"Content Engagement"`    | A lead engaged with **your content**                                                                       | `interaction` (`type`, `url`, `author`), `post`         |
| `influencer_engagement` | `"Influencer Engagement"` | A lead engaged with an **influencer's post**                                                               | `interaction` (`type`, `url`, `author`), `post`         |
| `deep_search`           | `"Deep Search"`           | A **company-level signal** was detected by AI research (e.g., funding round, hiring wave, expansion, etc.) | `title`, `tag`, `date`, `sources`                       |
| `job_posting`           | `"Job Posting"`           | A **job posting** matching your tracked criteria was published by a target company                         | `posting` (`title`, `job_url`, `location`), `job_title` |
| `champion_tracking`     | `"Champion Tracking"`     | ⚠️ **Work in progress** - A former champion **moved to a new company** (tracked via enrichment)            | `previous_position`, `new_position`                     |

### Parameters

| Name               | In    | Type    | Required | Description                                                                                                                                                                                                                                                                               |
| ------------------ | ----- | ------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| page               | query | integer | No       | Page number (starts at 1). Defaults to 1.                                                                                                                                                                                                                                                 |
| pageSize           | query | integer | No       | Number of items per page. Defaults to 25. Maximum: 100.                                                                                                                                                                                                                                   |
| signalStartDate    | query | string  | No       | Filter signals whose activity date (`signal_date`) is on or after this date (ISO 8601). When neither `signalStartDate` nor `detectionStartDate` is provided, results default to the last 90 days of `signal_date`; signals without a `signal_date` are excluded from that default window. |
| signalEndDate      | query | string  | No       | Filter signals whose activity date (`signal_date`) is on or before this date (ISO 8601)                                                                                                                                                                                                   |
| detectionStartDate | query | string  | No       | Filter signals detected by Sillage (`detection_date`) on or after this date (ISO 8601)                                                                                                                                                                                                    |
| detectionEndDate   | query | string  | No       | Filter signals detected by Sillage (`detection_date`) on or before this date (ISO 8601)                                                                                                                                                                                                   |
| agentType          | query | array   | No       | Filter by agent type. Comma-separated or repeated.                                                                                                                                                                                                                                        |
| agentId            | query | string  | No       | Filter signals by a specific agent document ID (nanoid format).                                                                                                                                                                                                                           |
| sort               | query | string  | No       | Sort order. Comma-separated list of fields, prefix with `-` for descending.                                                                                                                                                                                                               |

Supported fields: `signalDate`, `detectionDate`, `companyName`, `leadLastName`, `employeeCount`.

Single field: `-signalDate`, `-companyName`, `-detectionDate`

Multiple fields: `-signalDate,companyName` |

### Responses

#### 200 - Paginated list of signals

```
- **data**: Array<oneOf:
  -     - **signal**: object
      - **id**: string - Document ID of the signal
      - **signal_date**: string | null - Date when the LinkedIn activity occurred (e.g. when the post was published or the job change happened)
      - **detection_date**: string | null - Date when Sillage detected this signal
      - **signal_type**: string | null (linkedin_comment, linkedin_reaction, keyword_detection, lead_liked_competitor_content, lead_commented_competitor_content, lead_liked_influencer_content, lead_commented_influencer_content, recently_promoted, new_job, deep_search, job_posting, job_posting_insight, job_posting_hiring_manager, job_posting_keyword_detection) - Signal subtype (snake_case). Use `agent.agent_type` to determine the shape of `signal.data`.
      - **data**: object - Interaction data for competitor activity signals
        - **interaction**: object
          - **type?**: string (comment, reaction)
          - **url?**: string | null
          - **author?**: object
            - **full_name?**: string | null
            - **first_name?**: string | null
            - **last_name?**: string | null
            - **linkedin_url?**: string | null
            - **company_name?**: string | null
            - **role?**: string | null
            - **comment_text?**: string | null
        - **post**: object
          - **url?**: string | null
          - **extract?**: string | null
          - **author?**: object
            - **full_name?**: string | null
            - **first_name?**: string | null
            - **last_name?**: string | null
            - **linkedin_url?**: string | null
            - **company_name?**: string | null
            - **role?**: string | null
    - **agent**: object
      - **id**: string | null - Document ID of the agent that detected this signal
      - **name**: string - Display name of the agent (e.g. "Competitors' Activity", "Keyword Detection")
      - **agent_type**: string (competitor_activity)
    - **lead**: object
      - **id**: string | null - Document ID of the workspace lead
      - **first_name**: string | null
      - **last_name**: string | null
      - **linkedin_url**: string | null
      - **avatar_url**: string | null
      - **email**: string | null - Email address from the workspace lead record, with fallback to the profile email (null if neither is set)
      - **phone_number**: string | null - Phone number from the workspace lead record (null if not set)
      - **position**: string | null
      - **linkedin_handle**: string | null
      - **linkedin_headline**: string | null
      - **linkedin_about**: string | null
      - **location**: string | null
      - **salesforce?**: object - Salesforce IDs when a CRM match exists. Only present if the workspace has a Salesforce credential installed.
        - **contact_id?**: string | null - Salesforce Contact ID
        - **account_id?**: string | null - Salesforce Account ID
      - **hubspot?**: object - HubSpot IDs when a CRM match exists. Only present if the workspace has a HubSpot credential installed.
        - **contact_id?**: string | null - HubSpot Contact ID
        - **account_id?**: string | null - HubSpot Company ID
      - **current_company**: object
        - **name?**: string | null
        - **website_url?**: string | null
        - **linkedin_url?**: string | null
        - **number_of_employees?**: integer | null
        - **linkedin_handle?**: string | null
        - **activity_summary?**: string | null
        - **logo_url?**: string | null
        - **industries?**: string | null
        - **founded_year?**: integer | null
        - **employee_range?**: string | null
  -     - **signal**: object
      - **id**: string - Document ID of the signal
      - **signal_date**: string | null - Date when the LinkedIn activity occurred (e.g. when the post was published or the job change happened)
      - **detection_date**: string | null - Date when Sillage detected this signal
      - **signal_type**: string | null (linkedin_comment, linkedin_reaction, keyword_detection, lead_liked_competitor_content, lead_commented_competitor_content, lead_liked_influencer_content, lead_commented_influencer_content, recently_promoted, new_job, deep_search, job_posting, job_posting_insight, job_posting_hiring_manager, job_posting_keyword_detection) - Signal subtype (snake_case). Use `agent.agent_type` to determine the shape of `signal.data`.
      - **data**: object
        - **post**: object
          - **url?**: string | null
          - **extract?**: string | null
          - **author?**: object
            - **full_name?**: string | null
            - **headline?**: string | null
            - **linkedin_url?**: string | null
        - **keywords_found**: Array<string>
    - **agent**: object
      - **id**: string | null - Document ID of the agent that detected this signal
      - **name**: string - Display name of the agent (e.g. "Competitors' Activity", "Keyword Detection")
      - **agent_type**: string (keyword_detection)
    - **lead**: object
      - **id**: string | null - Document ID of the workspace lead
      - **first_name**: string | null
      - **last_name**: string | null
      - **linkedin_url**: string | null
      - **avatar_url**: string | null
      - **email**: string | null - Email address from the workspace lead record, with fallback to the profile email (null if neither is set)
      - **phone_number**: string | null - Phone number from the workspace lead record (null if not set)
      - **position**: string | null
      - **linkedin_handle**: string | null
      - **linkedin_headline**: string | null
      - **linkedin_about**: string | null
      - **location**: string | null
      - **salesforce?**: object - Salesforce IDs when a CRM match exists. Only present if the workspace has a Salesforce credential installed.
        - **contact_id?**: string | null - Salesforce Contact ID
        - **account_id?**: string | null - Salesforce Account ID
      - **hubspot?**: object - HubSpot IDs when a CRM match exists. Only present if the workspace has a HubSpot credential installed.
        - **contact_id?**: string | null - HubSpot Contact ID
        - **account_id?**: string | null - HubSpot Company ID
      - **current_company**: object
        - **name?**: string | null
        - **website_url?**: string | null
        - **linkedin_url?**: string | null
        - **number_of_employees?**: integer | null
        - **linkedin_handle?**: string | null
        - **activity_summary?**: string | null
        - **logo_url?**: string | null
        - **industries?**: string | null
        - **founded_year?**: integer | null
        - **employee_range?**: string | null
  -     - **signal**: object
      - **id**: string - Document ID of the signal
      - **signal_date**: string | null - Date when the LinkedIn activity occurred (e.g. when the post was published or the job change happened)
      - **detection_date**: string | null - Date when Sillage detected this signal
      - **signal_type**: string | null (linkedin_comment, linkedin_reaction, keyword_detection, lead_liked_competitor_content, lead_commented_competitor_content, lead_liked_influencer_content, lead_commented_influencer_content, recently_promoted, new_job, deep_search, job_posting, job_posting_insight, job_posting_hiring_manager, job_posting_keyword_detection) - Signal subtype (snake_case). Use `agent.agent_type` to determine the shape of `signal.data`.
      - **data**: object
        - **previous_position**: object
          - **role?**: string | null
          - **company_name?**: string | null
        - **new_position**: object
          - **role?**: string | null
          - **company_name?**: string | null
          - **start_date?**: string | null - Start date of the new position in YYYY-MM-DD format (day may default to 01 when only month is available)
    - **agent**: object
      - **id**: string | null - Document ID of the agent that detected this signal
      - **name**: string - Display name of the agent (e.g. "Competitors' Activity", "Keyword Detection")
      - **agent_type**: string (job_update)
    - **lead**: object
      - **id**: string | null - Document ID of the workspace lead
      - **first_name**: string | null
      - **last_name**: string | null
      - **linkedin_url**: string | null
      - **avatar_url**: string | null
      - **email**: string | null - Email address from the workspace lead record, with fallback to the profile email (null if neither is set)
      - **phone_number**: string | null - Phone number from the workspace lead record (null if not set)
      - **position**: string | null
      - **linkedin_handle**: string | null
      - **linkedin_headline**: string | null
      - **linkedin_about**: string | null
      - **location**: string | null
      - **salesforce?**: object - Salesforce IDs when a CRM match exists. Only present if the workspace has a Salesforce credential installed.
        - **contact_id?**: string | null - Salesforce Contact ID
        - **account_id?**: string | null - Salesforce Account ID
      - **hubspot?**: object - HubSpot IDs when a CRM match exists. Only present if the workspace has a HubSpot credential installed.
        - **contact_id?**: string | null - HubSpot Contact ID
        - **account_id?**: string | null - HubSpot Company ID
      - **current_company**: object
        - **name?**: string | null
        - **website_url?**: string | null
        - **linkedin_url?**: string | null
        - **number_of_employees?**: integer | null
        - **linkedin_handle?**: string | null
        - **activity_summary?**: string | null
        - **logo_url?**: string | null
        - **industries?**: string | null
        - **founded_year?**: integer | null
        - **employee_range?**: string | null
  -     - **signal**: object
      - **id**: string - Document ID of the signal
      - **signal_date**: string | null - Date when the LinkedIn activity occurred (e.g. when the post was published or the job change happened)
      - **detection_date**: string | null - Date when Sillage detected this signal
      - **signal_type**: string | null (linkedin_comment, linkedin_reaction, keyword_detection, lead_liked_competitor_content, lead_commented_competitor_content, lead_liked_influencer_content, lead_commented_influencer_content, recently_promoted, new_job, deep_search, job_posting, job_posting_insight, job_posting_hiring_manager, job_posting_keyword_detection) - Signal subtype (snake_case). Use `agent.agent_type` to determine the shape of `signal.data`.
      - **data**: object - Interaction data for content engagement signals
        - **interaction**: object
          - **type?**: string (comment, reaction)
          - **url?**: string | null
          - **author?**: object
            - **full_name?**: string | null
            - **first_name?**: string | null
            - **last_name?**: string | null
            - **linkedin_url?**: string | null
            - **company_name?**: string | null
            - **role?**: string | null
            - **comment_text?**: string | null
        - **post**: object
          - **url?**: string | null
          - **extract?**: string | null
          - **author?**: object
            - **full_name?**: string | null
            - **first_name?**: string | null
            - **last_name?**: string | null
            - **linkedin_url?**: string | null
            - **company_name?**: string | null
            - **role?**: string | null
    - **agent**: object
      - **id**: string | null - Document ID of the agent that detected this signal
      - **name**: string - Display name of the agent (e.g. "Competitors' Activity", "Keyword Detection")
      - **agent_type**: string (content_engagement)
    - **lead**: object
      - **id**: string | null - Document ID of the workspace lead
      - **first_name**: string | null
      - **last_name**: string | null
      - **linkedin_url**: string | null
      - **avatar_url**: string | null
      - **email**: string | null - Email address from the workspace lead record, with fallback to the profile email (null if neither is set)
      - **phone_number**: string | null - Phone number from the workspace lead record (null if not set)
      - **position**: string | null
      - **linkedin_handle**: string | null
      - **linkedin_headline**: string | null
      - **linkedin_about**: string | null
      - **location**: string | null
      - **salesforce?**: object - Salesforce IDs when a CRM match exists. Only present if the workspace has a Salesforce credential installed.
        - **contact_id?**: string | null - Salesforce Contact ID
        - **account_id?**: string | null - Salesforce Account ID
      - **hubspot?**: object - HubSpot IDs when a CRM match exists. Only present if the workspace has a HubSpot credential installed.
        - **contact_id?**: string | null - HubSpot Contact ID
        - **account_id?**: string | null - HubSpot Company ID
      - **current_company**: object
        - **name?**: string | null
        - **website_url?**: string | null
        - **linkedin_url?**: string | null
        - **number_of_employees?**: integer | null
        - **linkedin_handle?**: string | null
        - **activity_summary?**: string | null
        - **logo_url?**: string | null
        - **industries?**: string | null
        - **founded_year?**: integer | null
        - **employee_range?**: string | null
  -     - **signal**: object
      - **id**: string - Document ID of the signal
      - **signal_date**: string | null - Date when the LinkedIn activity occurred (e.g. when the post was published or the job change happened)
      - **detection_date**: string | null - Date when Sillage detected this signal
      - **signal_type**: string | null (linkedin_comment, linkedin_reaction, keyword_detection, lead_liked_competitor_content, lead_commented_competitor_content, lead_liked_influencer_content, lead_commented_influencer_content, recently_promoted, new_job, deep_search, job_posting, job_posting_insight, job_posting_hiring_manager, job_posting_keyword_detection) - Signal subtype (snake_case). Use `agent.agent_type` to determine the shape of `signal.data`.
      - **data**: object - Interaction data for influencer engagement signals
        - **interaction**: object
          - **type?**: string (comment, reaction)
          - **url?**: string | null
          - **author?**: object
            - **full_name?**: string | null
            - **first_name?**: string | null
            - **last_name?**: string | null
            - **linkedin_url?**: string | null
            - **company_name?**: string | null
            - **role?**: string | null
            - **comment_text?**: string | null
        - **post**: object
          - **url?**: string | null
          - **extract?**: string | null
          - **author?**: object
            - **full_name?**: string | null
            - **first_name?**: string | null
            - **last_name?**: string | null
            - **linkedin_url?**: string | null
            - **company_name?**: string | null
            - **role?**: string | null
    - **agent**: object
      - **id**: string | null - Document ID of the agent that detected this signal
      - **name**: string - Display name of the agent (e.g. "Competitors' Activity", "Keyword Detection")
      - **agent_type**: string (influencer_engagement)
    - **lead**: object
      - **id**: string | null - Document ID of the workspace lead
      - **first_name**: string | null
      - **last_name**: string | null
      - **linkedin_url**: string | null
      - **avatar_url**: string | null
      - **email**: string | null - Email address from the workspace lead record, with fallback to the profile email (null if neither is set)
      - **phone_number**: string | null - Phone number from the workspace lead record (null if not set)
      - **position**: string | null
      - **linkedin_handle**: string | null
      - **linkedin_headline**: string | null
      - **linkedin_about**: string | null
      - **location**: string | null
      - **salesforce?**: object - Salesforce IDs when a CRM match exists. Only present if the workspace has a Salesforce credential installed.
        - **contact_id?**: string | null - Salesforce Contact ID
        - **account_id?**: string | null - Salesforce Account ID
      - **hubspot?**: object - HubSpot IDs when a CRM match exists. Only present if the workspace has a HubSpot credential installed.
        - **contact_id?**: string | null - HubSpot Contact ID
        - **account_id?**: string | null - HubSpot Company ID
      - **current_company**: object
        - **name?**: string | null
        - **website_url?**: string | null
        - **linkedin_url?**: string | null
        - **number_of_employees?**: integer | null
        - **linkedin_handle?**: string | null
        - **activity_summary?**: string | null
        - **logo_url?**: string | null
        - **industries?**: string | null
        - **founded_year?**: integer | null
        - **employee_range?**: string | null
  -     - **signal**: object
      - **id**: string - Document ID of the signal
      - **signal_date**: string | null - Date when the LinkedIn activity occurred (e.g. when the post was published or the job change happened)
      - **detection_date**: string | null - Date when Sillage detected this signal
      - **signal_type**: string | null (linkedin_comment, linkedin_reaction, keyword_detection, lead_liked_competitor_content, lead_commented_competitor_content, lead_liked_influencer_content, lead_commented_influencer_content, recently_promoted, new_job, deep_search, job_posting, job_posting_insight, job_posting_hiring_manager, job_posting_keyword_detection) - Signal subtype (snake_case). Use `agent.agent_type` to determine the shape of `signal.data`.
      - **data**: object - Deep search signal data (AI-generated company intelligence)
        - **title?**: string | null - Signal title
        - **tag?**: string | null - Deep search signal subtype (e.g. funding, hiring, expansion)
        - **date?**: string | null - Date of the event (YYYY-MM-DD)
        - **sources?**: Array<          - **url?**: string | null
          - **excerpts?**: Array<string>>
    - **agent**: object
      - **id**: string | null - Document ID of the agent that detected this signal
      - **name**: string - Display name of the agent (e.g. "Competitors' Activity", "Keyword Detection")
      - **agent_type**: string (deep_search)
    - **lead**: object
      - **id**: string | null - Document ID of the workspace lead
      - **first_name**: string | null
      - **last_name**: string | null
      - **linkedin_url**: string | null
      - **avatar_url**: string | null
      - **email**: string | null - Email address from the workspace lead record, with fallback to the profile email (null if neither is set)
      - **phone_number**: string | null - Phone number from the workspace lead record (null if not set)
      - **position**: string | null
      - **linkedin_handle**: string | null
      - **linkedin_headline**: string | null
      - **linkedin_about**: string | null
      - **location**: string | null
      - **salesforce?**: object - Salesforce IDs when a CRM match exists. Only present if the workspace has a Salesforce credential installed.
        - **contact_id?**: string | null - Salesforce Contact ID
        - **account_id?**: string | null - Salesforce Account ID
      - **hubspot?**: object - HubSpot IDs when a CRM match exists. Only present if the workspace has a HubSpot credential installed.
        - **contact_id?**: string | null - HubSpot Contact ID
        - **account_id?**: string | null - HubSpot Company ID
      - **current_company**: object
        - **name?**: string | null
        - **website_url?**: string | null
        - **linkedin_url?**: string | null
        - **number_of_employees?**: integer | null
        - **linkedin_handle?**: string | null
        - **activity_summary?**: string | null
        - **logo_url?**: string | null
        - **industries?**: string | null
        - **founded_year?**: integer | null
        - **employee_range?**: string | null
  -     - **signal**: object
      - **id**: string - Document ID of the signal
      - **signal_date**: string | null - Date when the LinkedIn activity occurred (e.g. when the post was published or the job change happened)
      - **detection_date**: string | null - Date when Sillage detected this signal
      - **signal_type**: string | null (linkedin_comment, linkedin_reaction, keyword_detection, lead_liked_competitor_content, lead_commented_competitor_content, lead_liked_influencer_content, lead_commented_influencer_content, recently_promoted, new_job, deep_search, job_posting, job_posting_insight, job_posting_hiring_manager, job_posting_keyword_detection) - Signal subtype (snake_case). Use `agent.agent_type` to determine the shape of `signal.data`.
      - **data**: object - Job posting signal data
        - **posting?**: object
          - **title?**: string | null
          - **company_name?**: string | null
          - **job_url?**: string | null
          - **location?**: string | null
          - **description?**: string | null
          - **published_at?**: string | null
        - **job_title?**: string | null - Searched job title that matched this posting
        - **insight?**: object - AI insight analysis result (only for job_posting_insight signals)
          - **is_match?**: boolean - Whether the posting matches the search criteria
          - **tag?**: string | null
          - **reasoning?**: string | null
    - **agent**: object
      - **id**: string | null - Document ID of the agent that detected this signal
      - **name**: string - Display name of the agent (e.g. "Competitors' Activity", "Keyword Detection")
      - **agent_type**: string (job_posting)
    - **lead**: object
      - **id**: string | null - Document ID of the workspace lead
      - **first_name**: string | null
      - **last_name**: string | null
      - **linkedin_url**: string | null
      - **avatar_url**: string | null
      - **email**: string | null - Email address from the workspace lead record, with fallback to the profile email (null if neither is set)
      - **phone_number**: string | null - Phone number from the workspace lead record (null if not set)
      - **position**: string | null
      - **linkedin_handle**: string | null
      - **linkedin_headline**: string | null
      - **linkedin_about**: string | null
      - **location**: string | null
      - **salesforce?**: object - Salesforce IDs when a CRM match exists. Only present if the workspace has a Salesforce credential installed.
        - **contact_id?**: string | null - Salesforce Contact ID
        - **account_id?**: string | null - Salesforce Account ID
      - **hubspot?**: object - HubSpot IDs when a CRM match exists. Only present if the workspace has a HubSpot credential installed.
        - **contact_id?**: string | null - HubSpot Contact ID
        - **account_id?**: string | null - HubSpot Company ID
      - **current_company**: object
        - **name?**: string | null
        - **website_url?**: string | null
        - **linkedin_url?**: string | null
        - **number_of_employees?**: integer | null
        - **linkedin_handle?**: string | null
        - **activity_summary?**: string | null
        - **logo_url?**: string | null
        - **industries?**: string | null
        - **founded_year?**: integer | null
        - **employee_range?**: string | null
  -     - **signal**: object
      - **id**: string - Document ID of the signal
      - **signal_date**: string | null - Date when the LinkedIn activity occurred (e.g. when the post was published or the job change happened)
      - **detection_date**: string | null - Date when Sillage detected this signal
      - **signal_type**: string | null (linkedin_comment, linkedin_reaction, keyword_detection, lead_liked_competitor_content, lead_commented_competitor_content, lead_liked_influencer_content, lead_commented_influencer_content, recently_promoted, new_job, deep_search, job_posting, job_posting_insight, job_posting_hiring_manager, job_posting_keyword_detection) - Signal subtype (snake_case). Use `agent.agent_type` to determine the shape of `signal.data`.
      - **data**: object - Job posting keyword detection signal data
        - **keywords_found?**: Array<string> - The tracked keywords found in the job posting
        - **posting?**: object
          - **title?**: string | null - Title of the job posting
          - **job_url?**: string | null - Link to the job posting
    - **agent**: object
      - **id**: string | null - Document ID of the agent that detected this signal
      - **name**: string - Display name of the agent (e.g. "Competitors' Activity", "Keyword Detection")
      - **agent_type**: string (job_posting_keyword_detection)
    - **lead**: object
      - **id**: string | null - Document ID of the workspace lead
      - **first_name**: string | null
      - **last_name**: string | null
      - **linkedin_url**: string | null
      - **avatar_url**: string | null
      - **email**: string | null - Email address from the workspace lead record, with fallback to the profile email (null if neither is set)
      - **phone_number**: string | null - Phone number from the workspace lead record (null if not set)
      - **position**: string | null
      - **linkedin_handle**: string | null
      - **linkedin_headline**: string | null
      - **linkedin_about**: string | null
      - **location**: string | null
      - **salesforce?**: object - Salesforce IDs when a CRM match exists. Only present if the workspace has a Salesforce credential installed.
        - **contact_id?**: string | null - Salesforce Contact ID
        - **account_id?**: string | null - Salesforce Account ID
      - **hubspot?**: object - HubSpot IDs when a CRM match exists. Only present if the workspace has a HubSpot credential installed.
        - **contact_id?**: string | null - HubSpot Contact ID
        - **account_id?**: string | null - HubSpot Company ID
      - **current_company**: object
        - **name?**: string | null
        - **website_url?**: string | null
        - **linkedin_url?**: string | null
        - **number_of_employees?**: integer | null
        - **linkedin_handle?**: string | null
        - **activity_summary?**: string | null
        - **logo_url?**: string | null
        - **industries?**: string | null
        - **founded_year?**: integer | null
        - **employee_range?**: string | null>
- **meta**: object
  - **pagination**: object
    - **page**: integer - Current page
    - **pageSize**: integer - Items per page
    - **pageCount**: integer - Total number of pages
    - **total**: integer - Total number of signals
```

**Example (Competitor activity signal):**

```json
{
  "data": [
    {
      "signal": {
        "id": "n8ip5inzf8fgwi5ksrrdwy9i",
        "signal_date": "2025-09-09T08:15:00.000Z",
        "detection_date": "2025-09-09T10:30:00.000Z",
        "signal_type": "linkedin_comment",
        "data": {
          "interaction": {
            "type": "comment",
            "url": "https://www.linkedin.com/feed/update/urn:li:activity:0000000000000000001/#comment-001",
            "author": {
              "full_name": "Arthur Coudouy",
              "first_name": "Arthur",
              "last_name": "Coudouy",
              "linkedin_url": "https://www.linkedin.com/in/arthurcoudouy",
              "company_name": "Sillage",
              "role": "Co-founder & CTO",
              "comment_text": "Congrats Sarah! Well deserved, looking forward to seeing what's next."
            }
          },
          "post": {
            "url": "https://www.linkedin.com/feed/update/urn:li:activity:0000000000000000001/",
            "extract": "We just closed our Series A. Excited to keep building the future of B2B sales with an incredible team.",
            "author": {
              "full_name": "Jane Doe",
              "first_name": "Jane",
              "last_name": "Doe",
              "linkedin_url": "https://www.linkedin.com/in/jane-doe-example",
              "company_name": "Acme Corp",
              "role": "Head of Sales"
            }
          }
        }
      },
      "agent": {
        "id": "abc123",
        "name": "Competitors' Activity",
        "agent_type": "competitor_activity"
      },
      "lead": {
        "id": "a1b2c3d4e5f6g7h8i9j0klm",
        "first_name": "Jane",
        "last_name": "Doe",
        "linkedin_url": "https://www.linkedin.com/in/jane-doe-example",
        "avatar_url": null,
        "email": null,
        "phone_number": null,
        "position": "Head of Sales",
        "linkedin_handle": "jane-doe-example",
        "linkedin_headline": "Head of Sales @ Acme Corp | B2B Sales",
        "linkedin_about": null,
        "location": "Paris, Île-de-France, France",
        "salesforce": {
          "contact_id": "003xx000004TMMaBC",
          "account_id": "001xx000008ABCdEF"
        },
        "hubspot": {
          "contact_id": "501",
          "account_id": "9872345"
        },
        "current_company": {
          "name": "Acme Corp",
          "website_url": "https://www.acme-example.com",
          "linkedin_url": "https://www.linkedin.com/company/acme-example",
          "number_of_employees": 250,
          "linkedin_handle": "acme-example",
          "activity_summary": null,
          "logo_url": null,
          "industries": "Software Development",
          "founded_year": 2015,
          "employee_range": "201-500"
        }
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 1
    }
  }
}
```

**Example (Keyword detection signal):**

```json
{
  "data": [
    {
      "signal": {
        "id": "n8dz5inzf8fgwiksrrdwy9i",
        "signal_date": "2025-09-09T08:15:00.000Z",
        "detection_date": "2025-09-09T11:00:00.000Z",
        "signal_type": "keyword_detection",
        "data": {
          "post": {
            "url": "https://www.linkedin.com/posts/jane-doe-example-buyingsignals-activity-0000000000000000002",
            "extract": "We're evaluating new sales intelligence tools to help our team prioritize outreach. Buying signals and AI-powered prospecting are top of mind this quarter.",
            "author": {
              "full_name": "Jane Doe",
              "headline": "VP Sales @ Acme Inc | B2B Revenue Growth",
              "linkedin_url": "https://www.linkedin.com/in/jane-doe-example"
            }
          },
          "keywords_found": ["buying signals", "sales intelligence"]
        }
      },
      "agent": {
        "id": "def456",
        "name": "Keyword Detection",
        "agent_type": "keyword_detection"
      },
      "lead": {
        "id": "a1b2c3d4e5f6g7h8i9j0klm",
        "first_name": "Jane",
        "last_name": "Doe",
        "linkedin_url": "https://www.linkedin.com/in/jane-doe-example",
        "avatar_url": null,
        "email": null,
        "phone_number": null,
        "position": "VP Sales",
        "linkedin_handle": "jane-doe-example",
        "linkedin_headline": "VP Sales @ Acme Inc | Former Head of Sales @ Acme Corp",
        "linkedin_about": null,
        "location": "Paris, Île-de-France, France",
        "current_company": {
          "name": "Acme Inc",
          "website_url": "https://www.acme-inc-example.com",
          "linkedin_url": "https://www.linkedin.com/company/acme-inc-example",
          "number_of_employees": null,
          "linkedin_handle": "acme-inc-example",
          "activity_summary": null,
          "logo_url": null,
          "industries": "SaaS",
          "founded_year": null,
          "employee_range": "11-50"
        }
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 1
    }
  }
}
```

**Example (Job update signal):**

```json
{
  "data": [
    {
      "signal": {
        "id": "n8gh5inzf8fgwiksrrdwy9i",
        "signal_date": "2025-09-01T00:00:00.000Z",
        "detection_date": "2025-09-09T14:00:00.000Z",
        "signal_type": "new_job",
        "data": {
          "previous_position": {
            "role": "Head of Sales",
            "company_name": "Acme Corp"
          },
          "new_position": {
            "role": "VP Sales",
            "company_name": "Appleseed Inc",
            "start_date": "2025-09-01T00:00:00.000Z"
          }
        }
      },
      "agent": {
        "id": "ghi789",
        "name": "Job Updates",
        "agent_type": "job_update"
      },
      "lead": {
        "id": "a1b2c3d4e5f6g7h8i9j0klm",
        "first_name": "Jane",
        "last_name": "Doe",
        "linkedin_url": "https://www.linkedin.com/in/jane-doe-example",
        "avatar_url": null,
        "email": null,
        "phone_number": null,
        "position": "VP Sales",
        "linkedin_handle": "jane-doe-example",
        "linkedin_headline": "VP Sales @ Appleseed Inc | Former Head of Sales @ Acme Corp",
        "linkedin_about": null,
        "location": "Paris, Île-de-France, France",
        "hubspot": {
          "contact_id": "60123",
          "account_id": "9001234"
        },
        "current_company": {
          "name": "Appleseed Inc",
          "website_url": "https://www.appleseed-example.com",
          "linkedin_url": "https://www.linkedin.com/company/appleseed-inc-example",
          "number_of_employees": 45,
          "linkedin_handle": "appleseed-inc-example",
          "activity_summary": null,
          "logo_url": null,
          "industries": "Software Development",
          "founded_year": 2022,
          "employee_range": "11-50"
        }
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 1
    }
  }
}
```

**Example (Content engagement signal):**

```json
{
  "data": [
    {
      "signal": {
        "id": "n8jk5inzf8fgwiksrrdwy9i",
        "signal_date": "2025-09-09T08:15:00.000Z",
        "detection_date": "2025-09-09T12:00:00.000Z",
        "signal_type": "lead_liked_competitor_content",
        "data": {
          "interaction": {
            "type": "reaction",
            "url": null,
            "author": {
              "full_name": "Jane Doe",
              "first_name": "Jane",
              "last_name": "Doe",
              "linkedin_url": "https://www.linkedin.com/in/jane-doe-example",
              "company_name": "Acme Corp",
              "role": "Head of Sales",
              "comment_text": null
            }
          },
          "post": {
            "url": "https://www.linkedin.com/feed/update/urn:li:activity:0000000000000000003/",
            "extract": "Sillage detects buying signals from LinkedIn in real time - so your sales team reaches out at exactly the right moment.",
            "author": {
              "full_name": "Arthur Coudouy",
              "first_name": "Arthur",
              "last_name": "Coudouy",
              "linkedin_url": "https://www.linkedin.com/in/arthurcoudouy",
              "company_name": "Sillage",
              "role": "Co-founder & CTO"
            }
          }
        }
      },
      "agent": {
        "id": "jkl012",
        "name": "Content Engagement",
        "agent_type": "content_engagement"
      },
      "lead": {
        "id": "a1b2c3d4e5f6g7h8i9j0klm",
        "first_name": "Jane",
        "last_name": "Doe",
        "linkedin_url": "https://www.linkedin.com/in/jane-doe-example",
        "avatar_url": null,
        "email": null,
        "phone_number": null,
        "position": "Head of Sales",
        "linkedin_handle": "jane-doe-example",
        "linkedin_headline": "Head of Sales @ Acme Corp | B2B Sales",
        "linkedin_about": null,
        "location": null,
        "current_company": null
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 1
    }
  }
}
```

**Example (Deep search signal):**

```json
{
  "data": [
    {
      "signal": {
        "id": "ds1abc2def3ghi4jkl5mno",
        "signal_date": "2025-09-01T00:00:00.000Z",
        "detection_date": "2025-09-09T14:00:00.000Z",
        "signal_type": "deep_search",
        "data": {
          "title": "Series B Funding Round",
          "tag": "funding",
          "date": "2025-09-01",
          "sources": [
            {
              "url": "https://example.com/news/series-b",
              "excerpts": ["Company raised $50M in Series B funding"]
            }
          ]
        }
      },
      "agent": {
        "id": "agent-ds-001",
        "name": "Deep Search",
        "agent_type": "deep_search"
      },
      "lead": {
        "id": "a1b2c3d4e5f6g7h8i9j0klm",
        "first_name": null,
        "last_name": null,
        "linkedin_url": null,
        "avatar_url": null,
        "email": null,
        "phone_number": null,
        "position": null,
        "linkedin_handle": null,
        "linkedin_headline": null,
        "linkedin_about": null,
        "location": null,
        "current_company": {
          "name": "Target Corp",
          "website_url": "https://www.target-corp-example.com",
          "linkedin_url": "https://www.linkedin.com/company/target-corp-example",
          "number_of_employees": 500,
          "linkedin_handle": "target-corp-example",
          "activity_summary": null,
          "logo_url": null,
          "industries": "Software Development",
          "founded_year": 2018,
          "employee_range": "201-500"
        }
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 1
    }
  }
}
```

**Example (Job posting signal):**

```json
{
  "data": [
    {
      "signal": {
        "id": "jp1abc2def3ghi4jkl5mno",
        "signal_date": "2025-09-05T00:00:00.000Z",
        "detection_date": "2025-09-09T16:00:00.000Z",
        "signal_type": "job_posting",
        "data": {
          "posting": {
            "title": "Senior Sales Engineer",
            "company_name": "Acme Corp",
            "job_url": "https://www.linkedin.com/jobs/view/123456",
            "location": "Paris, France",
            "description": "We are looking for a Senior Sales Engineer...",
            "published_at": "2025-09-05T00:00:00.000Z"
          },
          "job_title": "Sales Engineer"
        }
      },
      "agent": {
        "id": "agent-jp-001",
        "name": "Job Posting",
        "agent_type": "job_posting"
      },
      "lead": {
        "id": "a1b2c3d4e5f6g7h8i9j0klm",
        "first_name": null,
        "last_name": null,
        "linkedin_url": null,
        "avatar_url": null,
        "email": null,
        "phone_number": null,
        "position": null,
        "linkedin_handle": null,
        "linkedin_headline": null,
        "linkedin_about": null,
        "location": null,
        "current_company": {
          "name": "Acme Corp",
          "website_url": "https://www.acme-corp-example.com",
          "linkedin_url": "https://www.linkedin.com/company/acme-corp-example",
          "number_of_employees": 250,
          "linkedin_handle": "acme-corp-example",
          "activity_summary": null,
          "logo_url": null,
          "industries": "Software Development",
          "founded_year": 2015,
          "employee_range": "201-500"
        }
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 1
    }
  }
}
```

**Example (Influencer engagement signal):**

```json
{
  "data": [
    {
      "signal": {
        "id": "n8pq5inzf8fgwiksrrdwy9i",
        "signal_date": "2025-09-09T08:15:00.000Z",
        "detection_date": "2025-09-09T13:45:00.000Z",
        "signal_type": "lead_commented_influencer_content",
        "data": {
          "interaction": {
            "type": "comment",
            "url": "https://www.linkedin.com/posts/arnaud-weiss-example-activity-0000000000000000004#comment-002",
            "author": {
              "full_name": "Jane Doe",
              "first_name": "Jane",
              "last_name": "Doe",
              "linkedin_url": "https://www.linkedin.com/in/jane-doe-example",
              "company_name": "Acme Corp",
              "role": "Head of Sales",
              "comment_text": "Totally agree - we've been testing this approach internally and the results are impressive."
            }
          },
          "post": {
            "url": "https://www.linkedin.com/posts/arnaud-weiss-example-activity-0000000000000000004",
            "extract": "AI is not replacing sales reps - it's giving them superpowers. Here's how signal-driven outreach is changing the game.",
            "author": {
              "full_name": "Arnaud Weiss",
              "first_name": "Arnaud",
              "last_name": "Weiss",
              "linkedin_url": "https://www.linkedin.com/in/arnaud-weiss-60b6758a/",
              "company_name": "Sillage",
              "role": "Co-founder & CEO"
            }
          }
        }
      },
      "agent": {
        "id": "pqr678",
        "name": "Influencer Engagement",
        "agent_type": "influencer_engagement"
      },
      "lead": {
        "id": "a1b2c3d4e5f6g7h8i9j0klm",
        "first_name": "Jane",
        "last_name": "Doe",
        "linkedin_url": "https://www.linkedin.com/in/jane-doe-example",
        "avatar_url": null,
        "email": null,
        "phone_number": null,
        "position": "Head of Sales",
        "linkedin_handle": "jane-doe-example",
        "linkedin_headline": "Head of Sales @ Acme Corp | B2B Sales",
        "linkedin_about": null,
        "location": null,
        "current_company": null
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 1,
      "total": 1
    }
  }
}
```

#### 400 - Bad request - Invalid query parameters

```
- **error?**: object
  - **status?**: integer
  - **name?**: string
  - **message?**: string
```

#### 401 - Unauthorized - Invalid or missing API key

```
- **error?**: object
  - **status?**: integer
  - **name?**: string
  - **message?**: string
```

#### 429 - Too Many Requests - Rate limit exceeded

```
- **error?**: object
  - **status?**: integer
  - **name?**: string
  - **message?**: string
```

#### 500 - Internal server error

```
- **error?**: object
  - **status?**: integer
  - **name?**: string
  - **message?**: string
```

---

## GET /v1/workspace/leads

**List workspace leads**

Returns a paginated list of leads for the authenticated workspace.

---

## What is a lead?

A **lead** is a person detected by Sillage as a potential sales opportunity.
Each lead has a **status** (e.g. `pending`, `contacted_email`, `meeting_booked`).

## Status groups (query parameter)

The `status` query parameter filters leads by group. Each group includes one or more individual statuses:

| Group        | Included statuses                                                  |
| ------------ | ------------------------------------------------------------------ |
| `pending`    | `pending`                                                          |
| `contacted`  | `contacted_email`, `contacted_phone`, `contacted_linkedin`         |
| `interested` | `need_follow_up`, `already_in_touch`, `meeting_booked`, `customer` |
| `all`        | All active statuses                                                |

## Individual status values (response field)

| Status               | Description                 |
| -------------------- | --------------------------- |
| `pending`            | New lead, not yet contacted |
| `contacted_email`    | Contacted via email         |
| `contacted_phone`    | Contacted via phone         |
| `contacted_linkedin` | Contacted via LinkedIn      |
| `meeting_booked`     | Meeting has been booked     |
| `need_follow_up`     | Requires follow-up          |
| `already_in_touch`   | Already in contact          |
| `customer`           | Converted to customer       |
| `declined`           | Lead declined               |
| `disqualified`       | Lead disqualified           |

### Parameters

| Name       | In    | Type                                         | Required | Description                                                                                                                                   |
| ---------- | ----- | -------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| page       | query | integer                                      | No       | Page number (starts at 1). Defaults to 1.                                                                                                     |
| pageSize   | query | integer                                      | No       | Number of items per page. Defaults to 25. Maximum: 100.                                                                                       |
| status     | query | string (pending, contacted, interested, all) | No       | Filter leads by status group. See the **Status groups** table above for details.                                                              |
| sortBy     | query | string (firstSeenAt, lastSignalAt)           | No       | Field to sort by. Defaults to `firstSeenAt`.                                                                                                  |
| sortOrder  | query | string (asc, desc)                           | No       | Sort direction. Defaults to `desc`.                                                                                                           |
| search     | query | string                                       | No       | Free-text search across name, email, company, and LinkedIn URL (of the lead). Max 200 characters.                                             |
| industries | query | string                                       | No       | Filter by industry names from company profiles. Comma-separated. Use GET /leads without this filter to discover available values.             |
| ownerIds   | query | string                                       | No       | Filter by owner document IDs (the `owner.id` field in the lead response). Comma-separated. Use `unassigned` to filter leads without an owner. |
| countries  | query | string                                       | No       | Filter by country names. Comma-separated.                                                                                                     |

### Responses

#### 200 - Paginated list of leads

```
- **data**: Array<  - **id**: string - Unique identifier of the lead
  - **status?**: string | null - Lead status (snake_case). Always present but may be `null` if the internal status has no known mapping.
  - **firstSeenAt**: string | null - When the lead was first detected
  - **lastSignalAt**: string | null - When the last signal was detected for this lead
  - **isExpired**: boolean - Whether the lead has expired
  - **email**: string | null - Best available email: enriched email > lead email > profile email
  - **phoneNumber**: string | null - Best available phone: enriched phone > lead phone
  - **firstName**: string | null
  - **lastName**: string | null
  - **linkedinUrl**: string | null
  - **linkedinHandle**: string | null
  - **position**: string | null
  - **company**: object
    - **name?**: string | null
    - **domain?**: string | null
    - **linkedinUrl?**: string | null
    - **numberOfEmployees?**: integer | null
  - **owner**: object
    - **id?**: string
    - **email?**: string
    - **firstName?**: string | null
    - **lastName?**: string | null
  - **signals**: Array<    - **id**: string - Unique identifier of the signal
    - **signalType**: string - Type of signal (snake_case)
    - **detectedAt**: string | null - When the signal was detected
    - **signalDate**: string | null - When the signal event occurred
    - **agent**: object
      - **id?**: string | null
      - **name?**: string | null
    - **data**: oneOf:
      -         - **interaction**: object
          - **type?**: string (comment, reaction)
          - **url?**: string | null
          - **author?**: object
            - **full_name?**: string | null
            - **first_name?**: string | null
            - **last_name?**: string | null
            - **linkedin_url?**: string | null
            - **company_name?**: string | null
            - **role?**: string | null
            - **comment_text?**: string | null
        - **post**: object
          - **url?**: string | null
          - **extract?**: string | null
          - **author?**: object
            - **full_name?**: string | null
            - **first_name?**: string | null
            - **last_name?**: string | null
            - **linkedin_url?**: string | null
            - **company_name?**: string | null
            - **role?**: string | null
      -         - **post**: object
          - **url?**: string | null
          - **extract?**: string | null
          - **author?**: object
            - **full_name?**: string | null
            - **headline?**: string | null
            - **linkedin_url?**: string | null
        - **keywords_found**: Array<string>
      -         - **previous_position**: object
          - **role?**: string | null
          - **company_name?**: string | null
        - **new_position**: object
          - **role?**: string | null
          - **company_name?**: string | null
          - **start_date?**: string | null - Start date of the new position in YYYY-MM-DD format (day may default to 01 when only month is available)
      -         - **interaction**: object
          - **type?**: string (comment, reaction)
          - **url?**: string | null
          - **author?**: object
            - **full_name?**: string | null
            - **first_name?**: string | null
            - **last_name?**: string | null
            - **linkedin_url?**: string | null
            - **company_name?**: string | null
            - **role?**: string | null
            - **comment_text?**: string | null
        - **post**: object
          - **url?**: string | null
          - **extract?**: string | null
          - **author?**: object
            - **full_name?**: string | null
            - **first_name?**: string | null
            - **last_name?**: string | null
            - **linkedin_url?**: string | null
            - **company_name?**: string | null
            - **role?**: string | null
      -         - **interaction**: object
          - **type?**: string (comment, reaction)
          - **url?**: string | null
          - **author?**: object
            - **full_name?**: string | null
            - **first_name?**: string | null
            - **last_name?**: string | null
            - **linkedin_url?**: string | null
            - **company_name?**: string | null
            - **role?**: string | null
            - **comment_text?**: string | null
        - **post**: object
          - **url?**: string | null
          - **extract?**: string | null
          - **author?**: object
            - **full_name?**: string | null
            - **first_name?**: string | null
            - **last_name?**: string | null
            - **linkedin_url?**: string | null
            - **company_name?**: string | null
            - **role?**: string | null
      -         - **title?**: string | null - Signal title
        - **tag?**: string | null - Deep search signal subtype (e.g. funding, hiring, expansion)
        - **date?**: string | null - Date of the event (YYYY-MM-DD)
        - **sources?**: Array<          - **url?**: string | null
          - **excerpts?**: Array<string>>
      -         - **posting?**: object
          - **title?**: string | null
          - **company_name?**: string | null
          - **job_url?**: string | null
          - **location?**: string | null
          - **description?**: string | null
          - **published_at?**: string | null
        - **job_title?**: string | null - Searched job title that matched this posting
        - **insight?**: object - AI insight analysis result (only for job_posting_insight signals)
          - **is_match?**: boolean - Whether the posting matches the search criteria
          - **tag?**: string | null
          - **reasoning?**: string | null
      -         - **keywords_found?**: Array<string> - The tracked keywords found in the job posting
        - **posting?**: object
          - **title?**: string | null - Title of the job posting
          - **job_url?**: string | null - Link to the job posting - Agent-type-specific signal payload. Shape depends on `agentType`. See the schema definitions below for each agent type.
    - **agentType**: string | null (competitor_activity, keyword_detection, job_update, content_engagement, influencer_engagement, deep_search, job_posting, job_posting_keyword_detection) - Agent category that detected this signal. Determines the shape of `data`.> - List of detections (signals) associated with this lead>
- **meta**: object
  - **pagination**: object
    - **page**: integer
    - **pageSize**: integer
    - **pageCount**: integer
    - **total**: integer
```

**Example (Paginated leads response):**

```json
{
  "data": [
    {
      "id": "abc123def456ghi789jkl0mn",
      "status": "pending",
      "firstSeenAt": "2026-03-01T10:00:00.000Z",
      "lastSignalAt": "2026-03-15T14:30:00.000Z",
      "isExpired": false,
      "email": "john@example.com",
      "phoneNumber": "+33612345678",
      "firstName": "John",
      "lastName": "Snow",
      "linkedinUrl": "https://linkedin.com/in/john-snow",
      "linkedinHandle": "john-snow",
      "position": "VP Sales",
      "company": {
        "name": "Example Inc",
        "domain": "example.com",
        "linkedinUrl": "https://linkedin.com/company/example",
        "numberOfEmployees": 250
      },
      "owner": {
        "id": "usr123abc456def789ghi0jk",
        "email": "john@appleseed.com",
        "firstName": "John",
        "lastName": "Appleseed"
      },
      "signals": [
        {
          "id": "det123abc456def789ghi0jk",
          "signalType": "new_job",
          "detectedAt": "2026-03-01T10:00:00.000Z",
          "signalDate": "2026-02-28T00:00:00.000Z",
          "agent": {
            "id": "agent123",
            "name": "Job Updates"
          },
          "data": {
            "previous_company": "Acme Corp",
            "previous_position": "Sales Director",
            "new_company": "Example Inc",
            "new_position": "VP Sales"
          },
          "agentType": "job_update"
        },
        {
          "id": "det456abc789def012ghi3jk",
          "signalType": "keyword_detection",
          "detectedAt": "2026-03-15T14:30:00.000Z",
          "signalDate": "2026-03-15T14:00:00.000Z",
          "agent": {
            "id": "agent456",
            "name": "Keyword Tracker"
          },
          "data": {
            "post": {
              "url": "https://linkedin.com/posts/example",
              "extract": "Looking for new sales tools..."
            },
            "keywords_found": ["sales tools"]
          },
          "agentType": "keyword_detection"
        }
      ]
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "pageSize": 25,
      "pageCount": 4,
      "total": 87
    }
  }
}
```

#### 400 - Bad request - Invalid query parameters

```
- **error?**: object
  - **status?**: integer
  - **name?**: string
  - **message?**: string
```

#### 401 - Unauthorized - Invalid or missing API key

```
- **error?**: object
  - **status?**: integer
  - **name?**: string
  - **message?**: string
```

#### 429 - Too Many Requests - Rate limit exceeded

```
- **error?**: object
  - **status?**: integer
  - **name?**: string
  - **message?**: string
```

#### 500 - Internal server error

```
- **error?**: object
  - **status?**: integer
  - **name?**: string
  - **message?**: string
```

---

## PATCH /v1/workspace/leads/{id}

**Update a workspace lead**

Updates a single field on a workspace lead.

---

## Status values

| Status               | Description                  |
| -------------------- | ---------------------------- |
| `pending`            | Default status for new leads |
| `contacted_email`    | Contacted via email          |
| `contacted_phone`    | Contacted via phone          |
| `contacted_linkedin` | Contacted via LinkedIn       |
| `meeting_booked`     | Meeting has been booked      |
| `need_follow_up`     | Requires follow-up           |
| `already_in_touch`   | Already in contact           |
| `customer`           | Converted to customer        |
| `declined`           | Lead declined                |
| `disqualified`       | Lead disqualified            |
| `company_not_icp`    | Company does not match ICP   |
| `job_title_not_icp`  | Job title does not match ICP |

---

## Owner

Set `owner` to a workspace member's email to assign ownership.

Set `owner=null` to unassign the current owner.

### Parameters

| Name   | In    | Type                                                                                                                                                                                           | Required | Description                                                              |
| ------ | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------ |
| id     | path  | string                                                                                                                                                                                         | Yes      | Unique identifier of the lead to update.                                 |
| status | query | string (pending, contacted_email, contacted_phone, contacted_linkedin, meeting_booked, need_follow_up, already_in_touch, customer, declined, disqualified, company_not_icp, job_title_not_icp) | No       | New lead status.                                                         |
| owner  | query | string                                                                                                                                                                                         | No       | Email of a workspace member to assign as owner. Send `null` to unassign. |

### Responses

#### 200 - Updated lead

```
- **data**: object
  - **id**: string
  - **status**: string | null
  - **firstSeenAt**: string | null
  - **lastSignalAt**: string | null
  - **isExpired**: boolean
  - **email**: string | null
  - **phoneNumber**: string | null
  - **firstName**: string | null
  - **lastName**: string | null
  - **linkedinUrl**: string | null
  - **linkedinHandle**: string | null
  - **position**: string | null
  - **company**: object
    - **name?**: string | null
    - **domain?**: string | null
    - **linkedinUrl?**: string | null
    - **numberOfEmployees?**: integer | null
  - **owner**: object
    - **id?**: string
    - **email?**: string
    - **firstName?**: string | null
    - **lastName?**: string | null
  - **signals**: Array<    - **id**: string - Unique identifier of the signal
    - **signalType**: string - Type of signal (snake_case)
    - **detectedAt**: string | null - When the signal was detected
    - **signalDate**: string | null - When the signal event occurred
    - **agent**: object
      - **id?**: string | null
      - **name?**: string | null
    - **data**: any | null - Agent-type-specific signal payload. Shape depends on `agentType`. Same format as `signal.data` in the GET /v1/workspace/signals endpoint.
    - **agentType**: string | null (competitor_activity, keyword_detection, job_update, content_engagement, influencer_engagement, deep_search, job_posting, job_posting_keyword_detection) - Agent category that detected this signal. Determines the shape of `data`.> - List of detections (signals) associated with this lead
```

**Example (Updated lead response):**

```json
{
  "data": {
    "id": "abc123def456ghi789jkl0mn",
    "status": "contacted_email",
    "firstSeenAt": "2026-03-01T10:00:00.000Z",
    "lastSignalAt": "2026-03-15T14:30:00.000Z",
    "isExpired": false,
    "email": "john@example.com",
    "phoneNumber": "+33612345678",
    "firstName": "John",
    "lastName": "Snow",
    "linkedinUrl": "https://linkedin.com/in/john-snow",
    "linkedinHandle": "john-snow",
    "position": "VP Sales",
    "company": {
      "name": "Example Inc",
      "domain": "example.com",
      "linkedinUrl": "https://linkedin.com/company/example",
      "numberOfEmployees": 250
    },
    "owner": {
      "id": "usr123abc456def789ghi0jk",
      "email": "john@appleseed.com",
      "firstName": "John",
      "lastName": "Appleseed"
    },
    "signals": [
      {
        "id": "det123abc456def789ghi0jk",
        "signalType": "new_job",
        "detectedAt": "2026-03-10T08:00:00.000Z",
        "signalDate": "2026-03-05T00:00:00.000Z",
        "agent": {
          "id": "agt123abc456def789ghi0jk",
          "name": "Job Updates"
        },
        "data": {
          "previous_company": "Old Corp",
          "previous_position": "Director",
          "new_company": "Example Inc",
          "new_position": "VP Sales"
        },
        "agentType": "job_update"
      }
    ]
  }
}
```

#### 400 - Bad request - invalid parameters, multiple fields provided, or owner not a workspace member.

```
- **error?**: string
- **details?**: object
  - **errors?**: object
```

**Example (Invalid status value):**

```json
{
  "error": "Invalid query parameters",
  "details": {
    "errors": {
      "status": [
        "Invalid enum value. Expected 'pending' | 'contacted_email' | ..."
      ]
    }
  }
}
```

**Example (Owner email not a workspace member):**

```json
{
  "error": "Owner email does not belong to a workspace member"
}
```

#### 401 - Unauthorized - invalid or missing API key.

```
- **error?**: string
```

**Example (Missing Authorization header):**

```json
{
  "error": "Missing or invalid Authorization header"
}
```

**Example (Invalid API key):**

```json
{
  "error": "Invalid API key"
}
```

#### 404 - Not found - lead does not exist in the workspace.

```
- **error?**: string
```

**Example (Lead not found):**

```json
{
  "error": "Lead not found"
}
```

#### 429 - Too Many Requests - rate limit exceeded. Retry after the window resets.

```
- **error?**: string
```

**Example (Rate limit exceeded):**

```json
{
  "error": "Rate limit exceeded. Try again later."
}
```

#### 500 - Internal server error - an unexpected error occurred while processing the update.

```
- **error?**: string
```

**Example (Internal error):**

```json
{
  "error": "An error occurred while updating the lead"
}
```

---

## GET /v2/contents/{id}

**Get a content item**

Returns a single content item by its numeric SQL id.

**Important:** the `id` path parameter is a numeric SQL identifier that is environment-specific (prod only). It is not portable across environments. Pass the top-level `id` returned by `POST /v2/contents/query`.

### Parameters

| Name            | In    | Type                                   | Required | Description                                                                                                                                     |
| --------------- | ----- | -------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| id              | path  | integer                                | Yes      | Numeric SQL id of the content item (the `id` returned by the list endpoint). Environment-specific, prod only, not portable across environments. |
| response_format | query | string (concise, normalized, detailed) | No       | Controls how much detail the `data` field includes.                                                                                             |

- `normalized` (default): a clean, stable projection of the content — see `data` in the response schema.
- `concise`: `data` is omitted entirely.
- `detailed`: deprecated alias of `normalized`, kept for backward compatibility. |

### Responses

#### 200 - Content item

```
- **data**: object
  - **id**: integer - Numeric SQL id of the content item. Environment-specific, prod only, not portable across environments.
  - **content_type**: string - Content type.
  - **created_at**: string - When the content record was created.
  - **data?**: object - What this content item is about. Shape depends on `content_type`; every field is
included only when we could extract it, so treat all fields as optional.

- LinkedIn posts (`linkedinPost`, `linkedinCompanyPost`): `post_id`, `original_post_id`
  (set when this is a repost), `is_repost`, `link`, `text` (full text, never truncated),
  `posted_at`, `engagement`, `author`, `mentions` (`{ profiles: [...], companies: [...] }`),
  `images` (array of URLs).
- LinkedIn comments (`linkedinComment`): `linkedin_id` (the comment's own LinkedIn id,
  when we have it), `text`, `linkedin_url`, `posted_at`, `engagement`, `author`, and
  `post_content_id` — the numeric id of the commented post in your contents (fetch it
  via the Contents endpoints), `null` when that post is not among your contents.
- `engagement` is the same flat shape for both posts and comments: `likes`, `comments`
  (replies, for a comment), `shares` (posts only), and a per-reaction-type breakdown —
  `praise`, `empathy`, `interest`, `appreciation` — whenever the source exposes it.
- LinkedIn reactions (`linkedinReaction`): `reaction_type` (e.g. `LIKE`), `author`,
  and `post` — the parent post being reacted to.
- LinkedIn job postings (`linkedinJobPosting`): `linkedin_id`, `linkedin_url`, `title`, `min_salary`,
  `max_salary` (a number or a free-text string such as `"$100K/yr"`, when disclosed),
  `location`, `posted_at`, `description` (full text).
- Every other content type: `text` when we have it, omitted otherwise.
    - **linkedin_id?**: string - The item's own LinkedIn id (a comment or a job posting) — not to be confused with this content item's own `id` at the top level.
    - **post_id?**: string
    - **original_post_id?**: string | null
    - **is_repost?**: boolean
    - **link?**: string
    - **text?**: string
    - **posted_at?**: string
    - **reaction_type?**: string
    - **engagement?**: object - Same flat shape for posts and comments. `shares` is posts only; `comments` means comments on a post, or replies to a comment. The reaction breakdown (`praise`/`empathy`/`interest`/`appreciation`) is present whenever the source exposes it.
      - **likes?**: integer
      - **comments?**: integer - Number of comments on a post, or number of replies to a comment.
      - **shares?**: integer - Posts only.
      - **praise?**: integer
      - **empathy?**: integer
      - **interest?**: integer
      - **appreciation?**: integer
    - **author?**: object - Who posted, commented, or reacted — a person or a company page.
      - **type**: string (profile, company)
      - **full_name?**: string - Present when `type` is `profile`.
      - **headline?**: string | null - Present when `type` is `profile`.
      - **company_name?**: string - Present when `type` is `company`.
      - **linkedin_url?**: string
    - **mentions?**: object
      - **profiles?**: Array<        - **name?**: string
        - **linkedin_url?**: string>
      - **companies?**: Array<        - **name?**: string
        - **linkedin_url?**: string>
    - **images?**: Array<string>
    - **post?**: object - The post a reaction was made on.
      - **post_id?**: string
      - **link?**: string
      - **text?**: string
      - **author?**: object - Who posted, commented, or reacted — a person or a company page.
        - **type**: string (profile, company)
        - **full_name?**: string - Present when `type` is `profile`.
        - **headline?**: string | null - Present when `type` is `profile`.
        - **company_name?**: string - Present when `type` is `company`.
        - **linkedin_url?**: string
    - **post_content_id?**: integer | null - Comments only — the id of the commented post in your contents, usable with the Contents endpoints. `null` when that post is not among your contents.
    - **linkedin_url?**: string - URL of the item on LinkedIn (comment or job posting).
    - **title?**: string - Job posting title.
    - **min_salary?**: oneOf:
      - number
      - string - Minimum disclosed salary, when available.
    - **max_salary?**: oneOf:
      - number
      - string - Maximum disclosed salary, when available.
    - **location?**: string - Job posting location.
    - **description?**: string - Full job posting description.
  - **lead_id**: integer | null - Numeric SQL id of the lead who posted, commented, or reacted, when they are one of your leads. Environment-specific, prod only.
  - **company_id**: integer | null - The associated company's ID in Sillage. `null` when the company is not on your target account list.
```

#### 400

#### 401

#### 404

#### 429

#### 500

---

## POST /v2/contents/query

**Query workspace contents**

Returns a paginated list of content items for the authenticated workspace. Filters are passed as a JSON body, so identifier arrays (`company_domain`, `company_linkedin_handle`, `company_linkedin_url`) are not bound by URL length limits.

Authenticate with a `sk_live_` API key.

### Request Body

```
- **page?**: integer - Page number (starts at 1). Defaults to 1.
- **page_size?**: integer - Number of items per page. Defaults to 25. Maximum: 100.
- **date_from?**: string - Filter contents created on or after this date (ISO 8601).
- **date_to?**: string - Filter contents created on or before this date (ISO 8601).
- **content_type?**: Array<string (linkedinComment, recentlyPromoted, linkedinPost, linkedinCompanyPost, linkedinJobPosting, webArticle, pressRelease, blogPost)> - Filter by content type. Native JSON array.
- **company_id?**: integer - Filter by the company's ID in Sillage. Takes priority over all human-identifier fields.
- **company_domain?**: Array<string> - Filter by company domain(s). Native JSON array. Maximum 100 values. Human identifiers are resolved to company IDs using a single-winning-tier waterfall: `company_id` > `company_linkedin_handle` > `company_linkedin_url` > `company_domain`. Only the highest-priority supplied tier is used; lower tiers are ignored. Multi-value = union within the winning tier.
- **company_linkedin_handle?**: Array<string> - Filter by company LinkedIn handle(s). Native JSON array. Maximum 100 values. See `company_domain` for tier priority.
- **company_linkedin_url?**: Array<string> - Filter by company LinkedIn URL(s). Native JSON array. Maximum 100 values. See `company_domain` for tier priority.
- **lead_id?**: integer - Filter for content authored by one lead. Use the `lead_id` shown on each content item, returned by the signals endpoints, or from the lead lookup endpoint.
- **response_format?**: string (concise, normalized, detailed) - Controls how much detail the `data` field of each item includes. `normalized` (default): a clean, stable projection of the content. `concise`: `data` is omitted entirely. Lowest token footprint. `detailed`: deprecated alias of `normalized`, kept for backward compatibility.
```

### Responses

#### 200 - Paginated list of contents

```
- **data**: Array<  - **id**: integer - Numeric SQL id of the content item. Environment-specific, prod only, not portable across environments.
  - **content_type**: string - Content type.
  - **created_at**: string - When the content record was created.
  - **data?**: object - What this content item is about. Shape depends on `content_type`; every field is
included only when we could extract it, so treat all fields as optional.

- LinkedIn posts (`linkedinPost`, `linkedinCompanyPost`): `post_id`, `original_post_id`
  (set when this is a repost), `is_repost`, `link`, `text` (full text, never truncated),
  `posted_at`, `engagement`, `author`, `mentions` (`{ profiles: [...], companies: [...] }`),
  `images` (array of URLs).
- LinkedIn comments (`linkedinComment`): `linkedin_id` (the comment's own LinkedIn id,
  when we have it), `text`, `linkedin_url`, `posted_at`, `engagement`, `author`, and
  `post_content_id` — the numeric id of the commented post in your contents (fetch it
  via the Contents endpoints), `null` when that post is not among your contents.
- `engagement` is the same flat shape for both posts and comments: `likes`, `comments`
  (replies, for a comment), `shares` (posts only), and a per-reaction-type breakdown —
  `praise`, `empathy`, `interest`, `appreciation` — whenever the source exposes it.
- LinkedIn reactions (`linkedinReaction`): `reaction_type` (e.g. `LIKE`), `author`,
  and `post` — the parent post being reacted to.
- LinkedIn job postings (`linkedinJobPosting`): `linkedin_id`, `linkedin_url`, `title`, `min_salary`,
  `max_salary` (a number or a free-text string such as `"$100K/yr"`, when disclosed),
  `location`, `posted_at`, `description` (full text).
- Every other content type: `text` when we have it, omitted otherwise.
    - **linkedin_id?**: string - The item's own LinkedIn id (a comment or a job posting) — not to be confused with this content item's own `id` at the top level.
    - **post_id?**: string
    - **original_post_id?**: string | null
    - **is_repost?**: boolean
    - **link?**: string
    - **text?**: string
    - **posted_at?**: string
    - **reaction_type?**: string
    - **engagement?**: object - Same flat shape for posts and comments. `shares` is posts only; `comments` means comments on a post, or replies to a comment. The reaction breakdown (`praise`/`empathy`/`interest`/`appreciation`) is present whenever the source exposes it.
      - **likes?**: integer
      - **comments?**: integer - Number of comments on a post, or number of replies to a comment.
      - **shares?**: integer - Posts only.
      - **praise?**: integer
      - **empathy?**: integer
      - **interest?**: integer
      - **appreciation?**: integer
    - **author?**: object - Who posted, commented, or reacted — a person or a company page.
      - **type**: string (profile, company)
      - **full_name?**: string - Present when `type` is `profile`.
      - **headline?**: string | null - Present when `type` is `profile`.
      - **company_name?**: string - Present when `type` is `company`.
      - **linkedin_url?**: string
    - **mentions?**: object
      - **profiles?**: Array<        - **name?**: string
        - **linkedin_url?**: string>
      - **companies?**: Array<        - **name?**: string
        - **linkedin_url?**: string>
    - **images?**: Array<string>
    - **post?**: object - The post a reaction was made on.
      - **post_id?**: string
      - **link?**: string
      - **text?**: string
      - **author?**: object - Who posted, commented, or reacted — a person or a company page.
        - **type**: string (profile, company)
        - **full_name?**: string - Present when `type` is `profile`.
        - **headline?**: string | null - Present when `type` is `profile`.
        - **company_name?**: string - Present when `type` is `company`.
        - **linkedin_url?**: string
    - **post_content_id?**: integer | null - Comments only — the id of the commented post in your contents, usable with the Contents endpoints. `null` when that post is not among your contents.
    - **linkedin_url?**: string - URL of the item on LinkedIn (comment or job posting).
    - **title?**: string - Job posting title.
    - **min_salary?**: oneOf:
      - number
      - string - Minimum disclosed salary, when available.
    - **max_salary?**: oneOf:
      - number
      - string - Maximum disclosed salary, when available.
    - **location?**: string - Job posting location.
    - **description?**: string - Full job posting description.
  - **lead_id**: integer | null - Numeric SQL id of the lead who posted, commented, or reacted, when they are one of your leads. Environment-specific, prod only.
  - **company_id**: integer | null - The associated company's ID in Sillage. `null` when the company is not on your target account list.>
- **meta**: object
  - **pagination**: object
    - **page**: integer - Current page number
    - **page_size**: integer - Number of items per page
    - **page_count**: integer - Total number of pages
    - **total**: integer - Total number of matching items
  - **resolved_companies**: Array<    - **company_id**: integer - The matched company's ID in Sillage.
    - **matched_by**: string (company_id, linkedin_handle, linkedin_url, domain) - Which identifier tier produced this match.
    - **identifier**: string - The original identifier value supplied by the caller (domain, handle, URL, or numeric id echoed as a string).> - Companies resolved from the company filter (`company_id`, `company_domain`, `company_linkedin_handle`, or `company_linkedin_url`). Empty when no company filter was supplied. Each entry reflects the winning tier for this request.
```

#### 400

#### 401

#### 429

#### 500

---

## GET /v2/content-requests

**List workspace content requests**

Returns a paginated list of content requests for the authenticated workspace.

A **content request** represents an asynchronous enrichment or scraping job (e.g. account mapping, top-account content ingestion). The `stage` field tracks its progress.

By default, completed requests are excluded. Pass `stage[]=completed` to include them.

### Parameters

| Name                    | In    | Type                                          | Required | Description                                                                                                                        |
| ----------------------- | ----- | --------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| page                    | query | integer                                       | No       | Page number (starts at 1). Defaults to 1.                                                                                          |
| page_size               | query | integer                                       | No       | Number of items per page. Defaults to 25. Maximum: 100.                                                                            |
| date_from               | query | string                                        | No       | Filter by creation date on or after this date (ISO 8601).                                                                          |
| date_to                 | query | string                                        | No       | Filter by creation date on or before this date (ISO 8601).                                                                         |
| type                    | query | string (account_mapping, top_account_content) | No       | Filter by request type.                                                                                                            |
| stage[]                 | query | array                                         | No       | Filter by stage. Repeatable. Defaults to all stages except `completed`.                                                            |
| company_id              | query | integer                                       | No       | Filter by the company's ID in Sillage. When present, takes priority over all human-identifier params below.                        |
| company_domain          | query | array                                         | No       | Filter by company domain (e.g. `acme.com`). Comma-separated or repeatable. Maximum 100 values. See `company_id` for tier priority. |
| company_linkedin_handle | query | array                                         | No       | Filter by company LinkedIn handle. Comma-separated or repeatable. Maximum 100 values. See `company_id` for tier priority.          |
| company_linkedin_url    | query | array                                         | No       | Filter by company LinkedIn URL. Comma-separated or repeatable. Maximum 100 values. See `company_id` for tier priority.             |

### Responses

#### 200 - Paginated list of content requests

```
- **data**: Array<  - **id**: integer - Numeric SQL id of the content request. Environment-specific, prod only, not portable across environments.
  - **type**: string (account_mapping, top_account_content) - Request type.
  - **stage**: string (account_mapping_ready, account_mapping_in_progress, account_mapping_ingestion_ready, account_mapping_ingestion_in_progress, account_mapping_failed, completed, top_account_content_scraping_ready, top_account_content_scraping_starting, top_account_content_scraping_in_progress, top_account_content_ingestion_in_progress, top_account_content_failed) - Current processing stage.
  - **created_at**: string - When the request was created.
  - **updated_at**: string - When the request was last updated.
  - **company?**: object
    - **id**: integer - Numeric SQL id of the company. Environment-specific, prod only, not portable across environments.
    - **name?**: string | null
    - **domain?**: string | null
    - **linkedin_url?**: string | null
  - **inputs?**: any - Request-type-specific input payload.>
- **meta**: object
  - **pagination**: object
    - **page**: integer - Current page number
    - **page_size**: integer - Number of items per page
    - **page_count**: integer - Total number of pages
    - **total**: integer - Total number of matching items
  - **resolved_companies**: Array<    - **company_id**: integer - The matched company's ID in Sillage.
    - **matched_by**: string (company_id, linkedin_handle, linkedin_url, domain) - Which identifier tier produced this match.
    - **identifier**: string - The original identifier value supplied by the caller (domain, handle, URL, or numeric id echoed as a string).> - Companies resolved from the company filter. Same semantics as in `V2ContentsPaginatedResponse`.
```

#### 400

#### 401

#### 429

#### 500

---

## GET /v2/content-requests/{id}

**Get a content request**

Returns a single content request by its numeric SQL id.

**Important:** the `id` path parameter is a numeric SQL identifier that is environment-specific (prod only). It is not portable across environments. Pass the top-level `id` returned by `GET /v2/content-requests`.

### Parameters

| Name | In   | Type    | Required | Description                                                                                                                                        |
| ---- | ---- | ------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| id   | path | integer | Yes      | Numeric SQL id of the content request (the `id` returned by the list endpoint). Environment-specific, prod only, not portable across environments. |

### Responses

#### 200 - Content request item

```
- **data**: object
  - **id**: integer - Numeric SQL id of the content request. Environment-specific, prod only, not portable across environments.
  - **type**: string (account_mapping, top_account_content) - Request type.
  - **stage**: string (account_mapping_ready, account_mapping_in_progress, account_mapping_ingestion_ready, account_mapping_ingestion_in_progress, account_mapping_failed, completed, top_account_content_scraping_ready, top_account_content_scraping_starting, top_account_content_scraping_in_progress, top_account_content_ingestion_in_progress, top_account_content_failed) - Current processing stage.
  - **created_at**: string - When the request was created.
  - **updated_at**: string - When the request was last updated.
  - **company?**: object
    - **id**: integer - Numeric SQL id of the company. Environment-specific, prod only, not portable across environments.
    - **name?**: string | null
    - **domain?**: string | null
    - **linkedin_url?**: string | null
  - **inputs?**: any - Request-type-specific input payload.
```

#### 400

#### 401

#### 404

#### 429

#### 500

---

## POST /v2/content-requests/query

**Query workspace content requests (POST body)**

POST body alternative to `GET /v2/content-requests`. Accepts the same filters as native JSON arrays.

Use this variant when your identifier arrays exceed URL length limits. For small queries, prefer the GET endpoint.

Authenticate with a `sk_live_` API key.

### Request Body

```
- **page?**: integer - Page number (starts at 1). Defaults to 1.
- **page_size?**: integer - Number of items per page. Defaults to 25. Maximum: 100.
- **date_from?**: string - Filter by creation date on or after this date (ISO 8601).
- **date_to?**: string - Filter by creation date on or before this date (ISO 8601).
- **type?**: string (account_mapping, top_account_content) - Filter by request type.
- **stage?**: Array<string (account_mapping_ready, account_mapping_in_progress, account_mapping_ingestion_ready, account_mapping_ingestion_in_progress, account_mapping_failed, completed, top_account_content_mapping_in_progress, top_account_content_scraping_ready, top_account_content_scraping_starting, top_account_content_scraping_in_progress, top_account_content_ingestion_in_progress, top_account_content_failed)> - Filter by stage. Defaults to all stages except `completed`. Native JSON array.
- **company_id?**: integer - Filter by the company's ID in Sillage. Takes priority over all human-identifier fields.
- **company_domain?**: Array<string> - Filter by company domain(s). Native JSON array. Maximum 100 values. See `company_id` for tier priority.
- **company_linkedin_handle?**: Array<string> - Filter by company LinkedIn handle(s). Native JSON array. Maximum 100 values.
- **company_linkedin_url?**: Array<string> - Filter by company LinkedIn URL(s). Native JSON array. Maximum 100 values.
```

### Responses

#### 200 - Paginated list of content requests

```
- **data**: Array<  - **id**: integer - Numeric SQL id of the content request. Environment-specific, prod only, not portable across environments.
  - **type**: string (account_mapping, top_account_content) - Request type.
  - **stage**: string (account_mapping_ready, account_mapping_in_progress, account_mapping_ingestion_ready, account_mapping_ingestion_in_progress, account_mapping_failed, completed, top_account_content_scraping_ready, top_account_content_scraping_starting, top_account_content_scraping_in_progress, top_account_content_ingestion_in_progress, top_account_content_failed) - Current processing stage.
  - **created_at**: string - When the request was created.
  - **updated_at**: string - When the request was last updated.
  - **company?**: object
    - **id**: integer - Numeric SQL id of the company. Environment-specific, prod only, not portable across environments.
    - **name?**: string | null
    - **domain?**: string | null
    - **linkedin_url?**: string | null
  - **inputs?**: any - Request-type-specific input payload.>
- **meta**: object
  - **pagination**: object
    - **page**: integer - Current page number
    - **page_size**: integer - Number of items per page
    - **page_count**: integer - Total number of pages
    - **total**: integer - Total number of matching items
  - **resolved_companies**: Array<    - **company_id**: integer - The matched company's ID in Sillage.
    - **matched_by**: string (company_id, linkedin_handle, linkedin_url, domain) - Which identifier tier produced this match.
    - **identifier**: string - The original identifier value supplied by the caller (domain, handle, URL, or numeric id echoed as a string).> - Companies resolved from the company filter. Same semantics as in `V2ContentsPaginatedResponse`.
```

#### 400

#### 401

#### 429

#### 500

---

## POST /v2/top-account-list

**Replace top account list**

Replaces the workspace's target account list (TAL) with the provided accounts and begins ingesting them.

This is an **asynchronous** operation, the 202 response confirms the accounts were accepted. Poll `GET /v2/top-account-list/status` to check progress, then read the enriched results from `GET /v2/top-account-list/accounts` once ingestion completes.

**Quota:** workspaces on a capped plan have a cumulative top-account limit. The counter never decreases, replacing the list does not free up quota even though accounts absent from the new list are detached. A request that would exceed the remaining quota is rejected in full with `403` before any ingestion starts.

### Request Body

```
- **accounts**: Array<  - **linkedin_url?**: string - LinkedIn company URL.
  - **domain?**: string - Company domain (e.g. `acme.com`).> - List of target accounts. Each entry must include at least one of `linkedin_url` or `domain`.
```

### Responses

#### 202 - Accounts accepted for ingestion

```
- **tal_id**: integer - Identifier of the top account list.
- **accounts**: Array<  - **linkedin_url?**: string
  - **domain?**: string>
- **message**: string
```

#### 400

#### 401

#### 403

#### 422

#### 429

#### 500

---

## GET /v2/top-account-list/accounts

**List accounts (found only)**

Returns a paginated list of **found** accounts from the workspace top account list.

Only accounts whose enrichment resolved a company record (`status: found`) are included.
Accounts that could not be matched are available at `GET /v2/top-account-list/accounts/not-found`.

### Parameters

| Name      | In    | Type    | Required | Description                                             |
| --------- | ----- | ------- | -------- | ------------------------------------------------------- |
| page      | query | integer | No       | Page number (starts at 1). Defaults to 1.               |
| page_size | query | integer | No       | Number of items per page. Defaults to 25. Maximum: 100. |

### Responses

#### 200 - Paginated found accounts

```
- **data**: Array<  - **id?**: integer - Identifier of the enriched account.
  - **company_id?**: integer - The company's ID in Sillage (same as `id`).
  - **company**: object
    - **name?**: string
    - **domain?**: string
    - **linkedin_url?**: string
    - **linkedin_handle?**: string
    - **logo_url?**: string
    - **status**: string (found, not_found)
  - **imported_at**: string>
- **meta**: object
  - **pagination**: object
    - **page**: integer - Current page number
    - **page_size**: integer - Number of items per page
    - **page_count**: integer - Total number of pages
    - **total**: integer - Total number of matching items
```

#### 400

#### 401

#### 429

#### 500

---

## POST /v2/top-account-list/accounts

**Add accounts (batch)**

Adds a batch of accounts to the workspace top account list with **merge** semantics.

Existing accounts are preserved. Deduplication is handled automatically by the enrichment pipeline.

The ingestion runs asynchronously. Poll `GET /v2/top-account-list/status` to check progress, then read the enriched results from `GET /v2/top-account-list/accounts`.

**Quota:** workspaces on a capped plan have a cumulative top-account limit. A request whose accounts would push the total over the remaining quota is rejected in full with `403` before any ingestion starts — accounts that only match existing duplicates never consume quota.

### Request Body

```
- **accounts**: Array<  - **linkedin_url?**: string - LinkedIn company URL.
  - **domain?**: string - Company domain (e.g. `acme.com`).> - Accounts to add. Each entry must include at least one of `linkedin_url` or `domain`.
```

### Responses

#### 202 - Accounts accepted for ingestion

```
- **tal_id**: integer - Identifier of the top account list.
- **accounts**: Array<  - **linkedin_url?**: string
  - **domain?**: string>
- **message**: string
- **warnings?**: Array<string> - Advisory reminders about the resulting list, e.g. below the recommended 5-20 account band. Omitted when there is nothing to report. Never blocks the write.
```

#### 400

#### 401

#### 403

#### 422

#### 429

#### 500

---

## GET /v2/top-account-list/accounts/not-found

**List not-found accounts**

Returns a paginated list of accounts whose enrichment could not resolve a company record (`status: not_found`).

Each item carries the original `user_input` submitted (company name, domain, or LinkedIn URL), a partial `company` object with whatever data was available, and the `imported_at` timestamp.

Found accounts are available at `GET /v2/top-account-list/accounts`.

### Parameters

| Name      | In    | Type    | Required | Description                                             |
| --------- | ----- | ------- | -------- | ------------------------------------------------------- |
| page      | query | integer | No       | Page number (starts at 1). Defaults to 1.               |
| page_size | query | integer | No       | Number of items per page. Defaults to 25. Maximum: 100. |

### Responses

#### 200 - Paginated not-found accounts

```
- **data**: Array<  - **id?**: string - Workspace company document id, if created.
  - **company**: object
    - **name?**: string
    - **domain?**: string
    - **linkedin_url?**: string
    - **linkedin_handle?**: string
    - **logo_url?**: string
    - **status**: string (not_found) - Always `not_found` for this endpoint.
  - **user_input**: object - The original values submitted when this account was added.
    - **company_name?**: string
    - **domain?**: string
    - **linkedin_url?**: string
    - **custom_properties?**: object
  - **imported_at**: string - When this account was imported.>
- **meta**: object
  - **pagination**: object
    - **page**: integer - Current page number
    - **page_size**: integer - Number of items per page
    - **page_count**: integer - Total number of pages
    - **total**: integer - Total number of matching items
```

#### 400

#### 401

#### 429

#### 500

---

## POST /v2/top-account-list/accounts/remove

**Remove accounts (batch)**

Removes a batch of accounts from the workspace top account list.

Each item is matched by `linkedin_url` or `domain`. Non-matching items are silently skipped.

### Request Body

```
- **accounts**: Array<  - **linkedin_url?**: string
  - **domain?**: string> - Accounts to remove.
```

### Responses

#### 200 - Batch removal result

```
- **deleted_count**: integer - Number of accounts removed.
- **message**: string
```

#### 400

#### 401

#### 422

#### 429

#### 500

---

## GET /v2/top-account-list/status

**Get ingestion status**

Returns the current state of the latest top account list ingestion.

Poll this endpoint after calling `POST /v2/top-account-list` or `POST /v2/top-account-list/accounts` to track progress.

### Responses

#### 200 - Current ingestion status

```
- **state**: string (queued, processing, completed, failed) - Current state of the ingestion.
- **total_accounts**: integer - Number of accounts processed in the last ingestion.
```

#### 401

#### 429

#### 500

---

## GET /v2/top-account-list/count

**Count accounts (found only)**

Returns the total number of **found** accounts in the workspace top account list.

Only accounts whose enrichment resolved a company record (`status: found`) are counted.
Not-found accounts are excluded from this count.

### Responses

#### 200 - Found account count

```
- **total**: integer - Number of found accounts in the top account list.
```

#### 401

#### 429

#### 500

---

## DELETE /v2/top-account-list/accounts/{id}

**Remove account by id**

Removes a single account from the workspace top account list by its integer `id` (the `id` field returned by `GET /v2/top-account-list/accounts`). Returns 404 if no matching account is found or the id belongs to a different workspace.

### Parameters

| Name | In   | Type    | Required | Description                                                                      |
| ---- | ---- | ------- | -------- | -------------------------------------------------------------------------------- |
| id   | path | integer | Yes      | The company's ID in Sillage, as returned by the `id` field in the list endpoint. |

### Responses

#### 200 - Account removed

```
- **data**: object
  - **removed**: boolean - Always `true` in a 200 response.
```

#### 401

#### 404

#### 422

#### 429

#### 500

---

## GET /v2/persona

**Get workspace persona**

Returns the workspace's current persona (ideal customer profile targeting criteria). Returns `{ data: null }` with HTTP 200 when no persona has been configured yet.

### Responses

#### 200 - Persona retrieved (or not yet configured)

```
- **data**: object
  - **id?**: integer - Identifier of the persona.
  - **job_title?**: Array<string>
  - **exclude_job_title?**: Array<string>
  - **location?**: Array<string>
  - **headcount?**: Array<string>
  - **industry?**: Array<string>
  - **seniority?**: Array<string>
  - **additional_info?**: string | null
```

**Example (Persona configured):**

```json
{
  "data": {
    "id": 1234,
    "job_title": ["VP Sales", "Head of Sales"],
    "exclude_job_title": null,
    "location": ["France", "Germany"],
    "headcount": null,
    "industry": null,
    "seniority": ["vp", "director"],
    "additional_info": null
  }
}
```

**Example (No persona yet):**

```json
{
  "data": null
}
```

#### 401

#### 429

#### 500

---

## PUT /v2/persona

**Upsert workspace persona**

Creates or replaces the workspace's persona (ideal customer profile targeting criteria).

This is a **replace** operation, a second `PUT` updates the same persona record rather than creating a duplicate. All fields are optional; omitting a field leaves it unset.

### Request Body

```
- **job_title?**: Array<string> - Target job titles.
- **exclude_job_title?**: Array<string> - Job titles to exclude.
- **location?**: Array<string> - Target locations.
- **headcount?**: Array<string> - Target headcount ranges (enum values).
- **industry?**: Array<string> - Target industries.
- **seniority?**: Array<string> - Target seniority levels (enum values).
- **additional_info?**: string - Additional free-text persona context.
```

### Responses

#### 200 - Persona upserted

```
- **data**: object
  - **id**: integer - Identifier of the persona.
- **warnings?**: Array<string> - Advisory warnings about the submitted persona, e.g. a missing job_title/location or a location that could not be resolved to a country (account mapping will not run for it). Omitted when there is nothing to report. Never blocks the write — the persona above is already saved.
```

#### 400

#### 401

#### 422

#### 429

#### 500

---

## GET /v2/setup-state

**Get workspace setup state**

Returns workspace setup completeness in one call: the 4 legacy boolean signals plus a per-dimension checklist.

The checklist covers `persona`, `accounts`, `agents`, and `contents`. Each dimension has a `status` (`ok`, `warning`, or `blocked`), a plain-language `message`, and, when relevant, a `recommended_next_tool` naming exactly what to call next.

A `blocked` status on `contents` distinguishes two cases that used to be indistinguishable: the contents feature is not enabled for this workspace (contact Sillage) versus the feature being enabled with nothing generated yet (`warning`).

### Responses

#### 200 - Setup state retrieved

```
- **persona_set**: boolean - Whether a persona has been configured for this workspace.
- **list_uploaded**: boolean - Whether at least one account is in the top-account list.
- **ingestion_complete**: boolean - Whether ingestion of the top-account list has completed (state = 'completed').
- **has_contents**: boolean - Whether at least one generated content item exists for this workspace.
- **checklist**: object
  - **persona**: object
    - **status**: string (ok, warning, blocked)
    - **message**: string
    - **recommended_next_tool?**: string
    - **job_title_set**: boolean
    - **location_set**: boolean
  - **accounts**: object
    - **status**: string (ok, warning, blocked)
    - **message**: string
    - **recommended_next_tool?**: string
    - **count**: integer
    - **ingestion_state**: string (queued, processing, completed, failed)
    - **has_unresolved_accounts**: boolean
  - **agents**: object
    - **status**: string (ok, warning, blocked)
    - **message**: string
    - **recommended_next_tool?**: string
    - **count**: integer
    - **missing_priority_types**: Array<string (keyword_detection, competitor, partner, customer, influencer, champion, job_update)> - Recommended agent types (job update, competitor, customer, keyword detection) not yet present, in priority order.
  - **contents**: object
    - **status**: string (ok, warning, blocked)
    - **message**: string
    - **recommended_next_tool?**: string
    - **has_contents**: boolean
```

**Example (Thin persona, 1 account, 0 agents):**

```json
{
  "persona_set": true,
  "list_uploaded": true,
  "ingestion_complete": true,
  "has_contents": false,
  "checklist": {
    "persona": {
      "status": "warning",
      "message": "Persona is missing location. Without it, account mapping and employee-level content will not run correctly. Call sillage_v2_upsert_persona to complete it.",
      "recommended_next_tool": "sillage_v2_upsert_persona",
      "job_title_set": true,
      "location_set": false
    },
    "accounts": {
      "status": "warning",
      "message": "1 account(s) is below the recommended minimum of 5. Call sillage_v2_add_top_accounts to add more.",
      "recommended_next_tool": "sillage_v2_add_top_accounts",
      "count": 1,
      "ingestion_state": "completed",
      "has_unresolved_accounts": false
    },
    "agents": {
      "status": "blocked",
      "message": "No agents created yet. Call sillage_v2_create_agent to start detecting signals (recommended minimum: 3).",
      "recommended_next_tool": "sillage_v2_create_agent",
      "count": 0,
      "missing_priority_types": [
        "job_update",
        "competitor",
        "customer",
        "keyword_detection"
      ]
    },
    "contents": {
      "status": "warning",
      "message": "The contents feature is enabled but nothing has been generated yet. Call sillage_v2_get_requests_status to check whether account mapping or content generation is still in progress.",
      "recommended_next_tool": "sillage_v2_get_requests_status",
      "has_contents": false
    }
  }
}
```

#### 401

#### 429

#### 500

---

## GET /v2/requests-status

**Get in-flight workspace requests**

Returns all work currently being processed in your workspace as a single
`requests` list, newest first. Each item carries a `type` field telling you
what kind of work it is: `"account_mapping"`, `"top_account_content"`, or
`"signal"`.

Only pending and in-progress items are returned — failed and completed requests
are excluded from this snapshot.

Each item carries a `status` field (`"pending"` or `"in_progress"`) and a
plain-language `label` safe to show directly to a user.

Items with type `account_mapping` or `top_account_content` carry the company
they are running for and the timestamps.

Items with type `signal` carry a `companies` array (the accounts being scanned)
and a `scope` field: `"company"` when the run targets specific accounts, `"workspace"`
when it spans the whole workspace (e.g. a job-change run with no per-account scope).

`meta.in_flight_total` is the true count of pending and in-progress items.

The snapshot is paginated for extreme cases (e.g. a large account list being
ingested): one call returns up to `page_size` items (default and maximum 500,
newest first). When `meta.page_count` is greater than 1, request the remaining
pages with `?page=2`, `?page=3`, and so on.

An empty `requests` list means nothing is running — not an error.

### Parameters

| Name      | In    | Type    | Required | Description                                                                                  |
| --------- | ----- | ------- | -------- | -------------------------------------------------------------------------------------------- |
| page      | query | integer | No       | Page number. Only needed when a previous response reported `meta.page_count` greater than 1. |
| page_size | query | integer | No       | Items per page.                                                                              |

### Responses

#### 200 - In-flight work across the workspace, newest first

```
- **data**: object
  - **requests**: Array<oneOf:
    - any
    - any> - All in-flight items, newest first, mixed kinds — branch on `type`.
- **meta**: object
  - **in_flight_total**: integer - True total of in-flight items, regardless of pagination.
  - **page**: integer - Current page.
  - **page_size**: integer - Items per page.
  - **page_count**: integer - Total number of pages. Greater than 1 only in extreme cases — fetch the remaining pages to see everything.
```

#### 401

#### 429

#### 500

---

## GET /v2/workspace/signal-runs

**List in-flight signal runs**

Returns all signal runs that are currently in progress for the authenticated workspace.

Each item carries a `companies` array (the accounts being scanned) and a `scope` field:
`"company"` when the run targets specific accounts, `"workspace"` when it spans the whole
workspace.

This endpoint returns a snapshot — it is not paginated. An empty `data` array means no
runs are currently in progress.

### Responses

#### 200 - List of in-flight signal runs

```
- **data**: Array<  - **id**: integer - Numeric ID of the signal run. This ID is specific to your environment.
  - **status**: string (pending, in_progress) - Normalized status of the run. `"pending"` means waiting to start; `"in_progress"` means actively processing. Failed and completed runs are excluded from this endpoint.
  - **label**: string - Human-readable description of the run's current stage, safe to show to a user (e.g. "Detecting signals").
  - **created_at**: string - When the run was started.
  - **updated_at**: string - When the run was last updated.
  - **scope**: string (company, workspace) - `"company"` when the run targets specific accounts (companies array will be populated). `"workspace"` when it spans the whole workspace — companies will be empty, which is expected, not missing data.
  - **companies**: Array<    - **id**: integer - Numeric ID of the company. Specific to your environment.
    - **name**: string | null
    - **domain**: string | null> - The accounts being scanned in this run. Empty when `scope` is `"workspace"`.>
```

#### 401

#### 429

#### 500

---

## POST /v2/workspace/signal-runs

**Launch a signal run**

Starts a detection run for the agent across your target accounts. The signal
type is derived automatically from the agent — no `signal_key` is needed.
Watchlist agents launch both inbound and outbound directions; keyword agents
launch one run. Each direction returns one element in the response array.
The run starts immediately and responds with `202 Accepted`.

## Checking progress

Use each `signal_request_id` from the response array with
`GET /api/v2/workspace/signal-runs/{id}` to follow that run until `stage` is
`completed` (or `completed_partial` if some accounts could not be processed).

## Retries

Safe to retry, launching the same run again will not create duplicate matches.

### Request Body

```
- **agent_id**: integer - The ID of the agent to run, from your Sillage workspace. This ID is specific to your environment.
- **parameters?**: object - Optional run parameters. Keyword agents accept `lookback_days`; other agents ignore this field.
  - **lookback_days?**: integer - How many days back to scan for matches, counted from now. Defaults to 90. Keyword agents only.
```

### Responses

#### 202 - Signal run accepted and enqueued

```
Array<- **signal_request_id**: integer - ID of the created run. Use as `{id}` in the poll endpoint. This ID is specific to your environment.
- **stage**: string (running) - Always `running` on a successful launch.>
```

**Example (Keyword agent — one run):**

```json
[
  {
    "signal_request_id": 12345,
    "stage": "running"
  }
]
```

**Example (Watchlist agent — two runs (inbound + outbound)):**

```json
[
  {
    "signal_request_id": 12345,
    "stage": "running"
  },
  {
    "signal_request_id": 12346,
    "stage": "running"
  }
]
```

#### 400

#### 401

#### 403

#### 404

#### 429

#### 500

---

## GET /v2/workspace/signal-runs/{id}

**Poll a signal run**

Returns the current status of a run.

The `id` is the `signal_request_id` returned when you launched the run.
Runs that belong to a different workspace are not accessible and return 404.

### Parameters

| Name | In   | Type    | Required | Description                                                      |
| ---- | ---- | ------- | -------- | ---------------------------------------------------------------- |
| id   | path | integer | Yes      | The numeric `signal_request_id` returned by the launch endpoint. |

### Responses

#### 200 - Signal run status

```
- **signal_request_id**: integer - ID of the run.
- **stage**: string (waiting, running, completed, completed_partial, failed) - Current stage of the signal run.
- **metadata**: object - Extra details about a partially-covered run: the accounts that were not scanned. `null` when every account was scanned, or when the run failed entirely, in that case `stage` is `failed`.
  - **failed**: object
    - **dropped_account_ids**: Array<integer> - Accounts that were not scanned in this run. Retry the run to cover them. Each id is specific to your environment.
```

**Example (Still running):**

```json
{
  "signal_request_id": 12345,
  "stage": "running",
  "metadata": null
}
```

**Example (Completed):**

```json
{
  "signal_request_id": 12345,
  "stage": "completed",
  "metadata": null
}
```

**Example (Completed with incomplete coverage):**

```json
{
  "signal_request_id": 12345,
  "stage": "completed_partial",
  "metadata": {
    "failed": {
      "dropped_account_ids": [202, 203]
    }
  }
}
```

#### 401

#### 403

#### 404

#### 429

#### 500

---

## POST /v2/workspace/signals/query

**List signal detections**

Returns a cursor-paginated list of published signal detections for the authenticated workspace,
sorted by detection date descending (most recent first).

This endpoint uses cursor pagination instead of offset pagination. Pass the `next_cursor`
from one response as the `cursor` field of the next request to advance through the list.
When `has_more` is false, you have reached the end.

Use `GET /v2/workspace/signals/count` with the same filters to get the total count.

Note: this is a deliberate divergence from the standard v2 offset-pagination envelope.

### Request Body

```
- **cursor?**: string - Opaque pagination cursor. Pass the `next_cursor` value from the previous response to fetch the next page. Omit for the first page.
- **limit?**: integer - Number of items to return per page. Defaults to 25. Maximum: 100.
- **signal_start_date?**: string - Return detections whose signal date is on or after this timestamp (ISO 8601 with UTC offset).
- **signal_end_date?**: string - Return detections whose signal date is on or before this timestamp (ISO 8601 with UTC offset).
- **detection_start_date?**: string - Return detections that were first seen on or after this timestamp (ISO 8601 with UTC offset).
- **detection_end_date?**: string - Return detections that were first seen on or before this timestamp (ISO 8601 with UTC offset).
- **agent_id?**: integer - Return detections produced by a specific agent. Pass the numeric `agent_id` returned on each detection in the list response.
- **signal_run_id?**: integer - Return detections from a specific run. Pass the numeric run id returned by the signal-runs endpoint. Results are automatically scoped to your workspace. When no date filter is supplied, results default to the 90 days preceding the run's creation; pass any date filter to override.
- **type?**: Array<string (keywordDetection, newJob, recentlyPromoted, jobPostingKeywordDetection, competitorInboundComment, competitorOutboundComment, partnerInboundComment, partnerOutboundComment, customerInboundComment, customerOutboundComment, influencerInboundComment, influencerOutboundComment, championInboundComment, championOutboundComment)> - Filter results to one or more signal types; unknown values are rejected.
- **company_id?**: integer - Return detections for a specific company. Pass the numeric `company_id` returned in signal items — the same company ID used by `GET /v2/companies/{id}`. Taken at face value — no lookup is performed, so an ID that does not belong to your workspace returns an empty page rather than a `404`. Takes priority over all human-identifier fields below.
- **company_domain?**: Array<string> - Return detections for companies on your top-account list matching this domain. Native JSON array, maximum 100 values, OR filtering across multiple companies. See `company_id` for tier priority. Returns `404` when none of the supplied values resolve to a known company on your top-account list.
- **company_linkedin_handle?**: Array<string> - Return detections for companies on your top-account list matching this LinkedIn handle. Native JSON array, maximum 100 values. See `company_id` for tier priority. Returns `404` when none of the supplied values resolve to a known company on your top-account list.
- **company_linkedin_url?**: Array<string> - Return detections for companies on your top-account list matching this LinkedIn URL. Native JSON array, maximum 100 values. See `company_id` for tier priority. Returns `404` when none of the supplied values resolve to a known company on your top-account list.
- **lead_id?**: integer - Filter to signals linked to a specific lead. Use the `lead_id` returned by the signals endpoints; resolve details via `GET /v2/leads/{id}`. Only matches detections directly linked to the lead — not signals attributed to that lead through fallback matching.
```

### Responses

#### 200 - Cursor-paginated list of signal detections, sorted by detection date descending (most recent first).

```
- **data**: Array<  - **id**: integer - ID of the detection. Specific to your environment.
  - **signal_type?**: string | null - Signal type, e.g. "keywordDetection".
  - **data?**: oneOf:
    -       - **content_id?**: integer | null - ID of the content the keyword matched in. Fetch the full post via the Contents endpoints.
      - **author?**: oneOf:
        -           - **type**: string (profile)
          - **full_name?**: string | null
          - **headline?**: string | null - LinkedIn headline of the person.
          - **linkedin_url?**: string | null
        -           - **type**: string (company)
          - **company_name?**: string | null
          - **linkedin_url?**: string | null - Who published the post — a person or a company page (discriminated by `type`). Null when the publisher is unknown.
      - **keywords_found?**: Array<string> - The tracked keywords found in the post.
    -       - **interaction?**: object - The comment side of the interaction.
        - **type?**: string (comment)
        - **content_id?**: integer | null
        - **author?**: object - A person involved in a watchlist comment interaction.
          - **full_name?**: string | null
          - **linkedin_url?**: string | null
          - **headline?**: string | null - LinkedIn headline of the person.
      - **post?**: object - The post the comment was left on.
        - **content_id?**: integer | null
        - **author?**: object - A person involved in a watchlist comment interaction.
          - **full_name?**: string | null
          - **linkedin_url?**: string | null
          - **headline?**: string | null - LinkedIn headline of the person.
    -       - **previous_position?**: object - The role held before the change — fields are null when unknown.
        - **role?**: string | null
        - **company_name?**: string | null
      - **new_position?**: object - The new role.
        - **role?**: string | null
        - **company_name?**: string | null
        - **start_date?**: string | null - Start date as YYYY-MM-DD.
    -       - **title?**: string | null
      - **tag?**: string | null - Category of the event (e.g. funding).
      - **date?**: string | null
      - **sources?**: Array<        - **url?**: string | null
        - **excerpts?**: Array<string>>
    -       - **posting?**: object
        - **title?**: string | null
        - **company_name?**: string | null
        - **job_url?**: string | null
        - **location?**: string | null
        - **description?**: string | null
        - **published_at?**: string | null
      - **job_title?**: string | null - Detection payload — the shape depends on `signal_type`:
- `keywordDetection` → `V2KeywordDetectionData`
- `*InboundComment` / `*OutboundComment` (watchlist) → `V2WatchlistCommentData`
- `newJob`, `recentlyPromoted` → `V2JobUpdateData`
- `deepSearch` → `V2DeepSearchData`
- `jobPosting`, `jobPostingInsight`, `jobPostingHiringManager` → `V2JobPostingData`

Other signal types return their payload as-is.
  - **detected_at?**: string | null - When the detection was created.
  - **signal_date?**: string | null - Date of the underlying signal event (e.g. post publish date).
  - **lead_id?**: integer | null - ID of the associated workspace lead. For detections without their own lead (e.g. keyword matches), this is the content author's lead when known. Null when the author is unknown.
  - **company_id?**: integer | null - ID of the associated workspace company.
  - **agent_id?**: integer | null - ID of the agent that produced this detection.>
- **meta**: object
  - **next_cursor**: string | null - Opaque cursor to pass as `cursor` on the next request. Null when this is the last page.
  - **has_more**: boolean - Whether more results exist beyond this page.
```

**Example (One keyword detection):**

```json
{
  "data": [
    {
      "id": 101,
      "signal_type": "keywordDetection",
      "data": {
        "content_id": 5100,
        "author": {
          "type": "profile",
          "full_name": "Jane Doe",
          "headline": "VP Product at Acme",
          "linkedin_url": "https://linkedin.com/in/janedoe"
        },
        "keywords_found": ["AI"]
      },
      "detected_at": "2026-06-01T10:00:00.000Z",
      "signal_date": null,
      "lead_id": 456,
      "company_id": 789,
      "agent_id": 12
    }
  ],
  "meta": {
    "next_cursor": "eyJkZXRlY3RlZEF0IjoiMjAyNi0wNi0wMVQxMDowMDowMC4wMDBaIiwiaWQiOjEwMX0=",
    "has_more": true
  }
}
```

**Example (One watchlist comment detection):**

```json
{
  "data": [
    {
      "id": 102,
      "signal_type": "competitorInboundComment",
      "data": {
        "interaction": {
          "type": "comment",
          "content_id": 5001,
          "author": {
            "full_name": "Jane Doe",
            "linkedin_url": "https://linkedin.com/in/janedoe",
            "headline": "VP Product at Acme"
          }
        },
        "post": {
          "content_id": 5002,
          "author": {
            "full_name": "John Smith",
            "linkedin_url": "https://linkedin.com/in/johnsmith",
            "headline": "Head of Sales at Widgets"
          }
        }
      },
      "detected_at": "2026-06-01T10:00:00.000Z",
      "signal_date": "2026-05-28T08:12:00.000Z",
      "lead_id": 456,
      "company_id": 789,
      "agent_id": 12
    }
  ],
  "meta": {
    "next_cursor": null,
    "has_more": false
  }
}
```

#### 400

#### 401

#### 403

#### 404 - Returned when string company identifier(s) (`company_domain`, `company_linkedin_handle`, or `company_linkedin_url`) were supplied and none of them resolved to a known company in your workspace. Note: `company_id` is taken at face value and never triggers a `404` — an ID that does not belong to your workspace returns an empty result set instead.

#### 429

#### 500

---

## GET /v2/workspace/signals/count

**Count signal detections**

Returns the total number of published signal detections matching the given filters.

Accepts the same filter parameters as `POST /v2/workspace/signals/query`.
Use this endpoint to get a total before or alongside paginating the list.

### Parameters

| Name                    | In    | Type    | Required | Description                                                                                                                                                                                                                                                                                     |
| ----------------------- | ----- | ------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| signal_start_date       | query | string  | No       | Count detections whose signal date is on or after this timestamp (ISO 8601 with UTC offset).                                                                                                                                                                                                    |
| signal_end_date         | query | string  | No       | Count detections whose signal date is on or before this timestamp (ISO 8601 with UTC offset).                                                                                                                                                                                                   |
| detection_start_date    | query | string  | No       | Count detections that were first seen on or after this timestamp (ISO 8601 with UTC offset).                                                                                                                                                                                                    |
| detection_end_date      | query | string  | No       | Count detections that were first seen on or before this timestamp (ISO 8601 with UTC offset).                                                                                                                                                                                                   |
| agent_id                | query | integer | No       | Count detections produced by a specific agent. Pass the numeric `agent_id` returned on each detection in the list response.                                                                                                                                                                     |
| signal_run_id           | query | integer | No       | Count detections from a specific run. Pass the numeric run id returned by the signal-runs endpoint.                                                                                                                                                                                             |
| company_id              | query | integer | No       | Count detections for a specific company. Pass the numeric `company_id` returned in signal items — the same company ID used by `GET /v2/companies/{id}`. Taken at face value — no lookup is performed, so an ID that does not belong to your workspace returns a zero count rather than a `404`. |
| company_domain          | query | string  | No       | Count detections for companies on your top-account list matching this domain. Accepts a comma-separated list for OR filtering across multiple companies. Returns `404` when none of the supplied values resolve to a known company on your top-account list.                                    |
| company_linkedin_handle | query | string  | No       | Count detections for companies on your top-account list matching this LinkedIn handle. Accepts a comma-separated list for OR filtering across multiple companies. Returns `404` when none of the supplied values resolve to a known company on your top-account list.                           |
| company_linkedin_url    | query | string  | No       | Count detections for companies on your top-account list matching this LinkedIn URL. Accepts a comma-separated list for OR filtering across multiple companies. Returns `404` when none of the supplied values resolve to a known company on your top-account list.                              |
| lead_id                 | query | integer | No       | Filter to signals linked to a specific lead. Use the `lead_id` returned by the signals endpoints; resolve details via `GET /v2/leads/{id}`. Only matches detections directly linked to the lead — not signals attributed to that lead through fallback matching.                                |

### Responses

#### 200 - Total number of matching signal detections.

```
- **total**: integer - Total number of signal detections matching the supplied filters.
```

**Example (Count result):**

```json
{
  "total": 42
}
```

#### 400

#### 401

#### 403

#### 404 - Returned when string company identifier(s) (`company_domain`, `company_linkedin_handle`, or `company_linkedin_url`) were supplied and none of them resolved to a known company in your workspace. Note: `company_id` is taken at face value and never triggers a `404` — an ID that does not belong to your workspace returns a zero count instead.

#### 429

#### 500

---

## GET /v2/workspace/signals/{id}

**Get a single signal detection**

Returns one published signal detection by its ID.

**Important:** the `id` path parameter is specific to your environment.
Strict workspace scoping: a detection belonging to another workspace returns 404.

### Parameters

| Name | In   | Type    | Required | Description                                                  |
| ---- | ---- | ------- | -------- | ------------------------------------------------------------ |
| id   | path | integer | Yes      | ID of the detection (the `id` field from the list endpoint). |

### Responses

#### 200 - Detection found

```
- **data**: object
  - **id**: integer - ID of the detection. Specific to your environment.
  - **signal_type?**: string | null - Signal type, e.g. "keywordDetection".
  - **data?**: oneOf:
    -       - **content_id?**: integer | null - ID of the content the keyword matched in. Fetch the full post via the Contents endpoints.
      - **author?**: oneOf:
        -           - **type**: string (profile)
          - **full_name?**: string | null
          - **headline?**: string | null - LinkedIn headline of the person.
          - **linkedin_url?**: string | null
        -           - **type**: string (company)
          - **company_name?**: string | null
          - **linkedin_url?**: string | null - Who published the post — a person or a company page (discriminated by `type`). Null when the publisher is unknown.
      - **keywords_found?**: Array<string> - The tracked keywords found in the post.
    -       - **interaction?**: object - The comment side of the interaction.
        - **type?**: string (comment)
        - **content_id?**: integer | null
        - **author?**: object - A person involved in a watchlist comment interaction.
          - **full_name?**: string | null
          - **linkedin_url?**: string | null
          - **headline?**: string | null - LinkedIn headline of the person.
      - **post?**: object - The post the comment was left on.
        - **content_id?**: integer | null
        - **author?**: object - A person involved in a watchlist comment interaction.
          - **full_name?**: string | null
          - **linkedin_url?**: string | null
          - **headline?**: string | null - LinkedIn headline of the person.
    -       - **previous_position?**: object - The role held before the change — fields are null when unknown.
        - **role?**: string | null
        - **company_name?**: string | null
      - **new_position?**: object - The new role.
        - **role?**: string | null
        - **company_name?**: string | null
        - **start_date?**: string | null - Start date as YYYY-MM-DD.
    -       - **title?**: string | null
      - **tag?**: string | null - Category of the event (e.g. funding).
      - **date?**: string | null
      - **sources?**: Array<        - **url?**: string | null
        - **excerpts?**: Array<string>>
    -       - **posting?**: object
        - **title?**: string | null
        - **company_name?**: string | null
        - **job_url?**: string | null
        - **location?**: string | null
        - **description?**: string | null
        - **published_at?**: string | null
      - **job_title?**: string | null - Detection payload — the shape depends on `signal_type`:
- `keywordDetection` → `V2KeywordDetectionData`
- `*InboundComment` / `*OutboundComment` (watchlist) → `V2WatchlistCommentData`
- `newJob`, `recentlyPromoted` → `V2JobUpdateData`
- `deepSearch` → `V2DeepSearchData`
- `jobPosting`, `jobPostingInsight`, `jobPostingHiringManager` → `V2JobPostingData`

Other signal types return their payload as-is.
  - **detected_at?**: string | null - When the detection was created.
  - **signal_date?**: string | null - Date of the underlying signal event (e.g. post publish date).
  - **lead_id?**: integer | null - ID of the associated workspace lead. For detections without their own lead (e.g. keyword matches), this is the content author's lead when known. Null when the author is unknown.
  - **company_id?**: integer | null - ID of the associated workspace company.
  - **agent_id?**: integer | null - ID of the agent that produced this detection.
```

#### 401

#### 403

#### 404

#### 429

#### 500

---

## POST /v2/agents

**Create agent**

Creates an agent for the authenticated workspace.

Eight types are supported: `keyword_detection` (monitors LinkedIn posts for keywords),
`job_posting_keyword_detection` (monitors the job postings your tracked companies
publish for keywords), five semantic watchlist types — `competitor`, `partner`,
`customer` (company lists) and `influencer`, `champion` (profile lists) — and
`job_update`, which detects job changes and promotions among the workspace’s
contacts (takes no parameters).

For all five watchlist types, a watchlist of the matching type is **implicitly created**
and bound to the agent. Pass `watchlist_id` to bind an existing list instead; its `type`
must equal the chosen agent type or the request returns 422.

The agent is created **enabled** (`enabled: true`) and starts monitoring immediately.

### Request Body

```
oneOf:
-   - **tracking_keywords?**: Array<string> - Keywords this agent looks for in LinkedIn posts. Minimum 1 required. A bare keyword matches broadly, including inside longer words and phrases, which finds more posts but adds noise. Wrap a keyword in double quotes (for example "machine learning") to match that exact phrase only, which cuts noise and sharpens precision.
  - **name**: string - Display name of the agent.
  - **type**: string (keyword_detection)
  - **parameters**: object
    - **tracking_keywords**: Array<string> - Keywords Sillage monitors on LinkedIn. Minimum 1 required.
    - **max_posts_to_scrape?**: integer - Maximum number of posts to scrape per run.
    - **start_date?**: string - ISO 8601 date, scrape only posts published after this date.
-   - **name**: string - Display name of the agent.
  - **type**: string (competitor)
  - **watchlist_id?**: integer - Optional. Bind to an existing competitor watchlist instead of creating a new one. The list type must equal "competitor" or the request returns 422.
-   - **name**: string - Display name of the agent.
  - **type**: string (partner)
  - **watchlist_id?**: integer - Optional. Bind to an existing partner watchlist instead of creating a new one. The list type must equal "partner" or the request returns 422.
-   - **name**: string - Display name of the agent.
  - **type**: string (customer)
  - **watchlist_id?**: integer - Optional. Bind to an existing customer watchlist instead of creating a new one. The list type must equal "customer" or the request returns 422.
-   - **name**: string - Display name of the agent.
  - **type**: string (influencer)
  - **watchlist_id?**: integer - Optional. Bind to an existing influencer watchlist instead of creating a new one. The list type must equal "influencer" or the request returns 422.
-   - **name**: string - Display name of the agent.
  - **type**: string (champion)
  - **watchlist_id?**: integer - Optional. Bind to an existing champion watchlist instead of creating a new one. The list type must equal "champion" or the request returns 422.
-   - **name**: string - Display name of the agent.
  - **type**: string (job_update)
-   - **name**: string - Display name of the agent.
  - **type**: string (job_posting_keyword_detection)
  - **parameters**: object
    - **tracking_keywords**: Array<string> - Keywords Sillage looks for in the job postings your tracked companies publish (title and description). Minimum 1 required.
```

### Responses

#### 201 - Agent created.

```
- **data**: object
  - **id**: integer - Identifier of the agent.
  - **name**: string
  - **type**: string (keyword_detection, job_update, job_posting, job_posting_keyword_detection, competitor_activity, content_engagement, influencer_engagement, champion_tracking, competitor, partner, customer, influencer, champion, unconfigured) - The agent type. Watchlist agents return their semantic type (competitor, partner, customer, influencer, champion). `unconfigured` marks an agent that still needs to be set up — either its watchlist has not been defined yet, or its watchlist was unbound; its `parameters` is empty and `watchlist_kind`/`watchlist_id` are null. Bind a watchlist to give it a type again.
  - **enabled**: boolean - Whether the agent is currently active.
  - **watchlist_kind**: string | null (company, profile) - Kind of the bound watchlist, or null when unbound (paired with watchlist_id).
  - **watchlist_id**: integer | null - The bound watchlist id, or null when the agent is unbound.
  - **parameters**: oneOf:
    -       - **tracking_keywords?**: Array<string>
      - **start_date?**: string - ISO 8601 date, scrape only posts published after this date.
    -       - **tracking_keywords?**: Array<string>
    -       - **job_titles?**: Array<string>
      - **seniority_levels?**: Array<string>
      - **company_domains_to_scrape?**: Array<string>
      - **target_persona?**: Array<string>
      - **target_persona_locations?**: Array<string>
      - **interested_by?**: object
        - **prospects?**: boolean
        - **customers?**: boolean
      - **keywords_for_social_detection?**: Array<string>
      - **author_roles?**: Array<string>
      - **author_industries?**: Array<string>
      - **target_linkedin_profiles?**: Array<string>
    -       - **job_titles?**: Array<string>
      - **search_strings?**: Array<string>
      - **job_locations?**: Array<string>
      - **published_at?**: string
      - **target_top_accounts_only?**: boolean
    -       - **company_domains_to_scrape?**: Array<string>
      - **target_persona?**: Array<string>
      - **target_persona_locations?**: Array<string>
      - **interested_by?**: object
        - **prospects?**: boolean
        - **customers?**: boolean
      - **keywords_for_social_detection?**: Array<string>
      - **author_roles?**: Array<string>
      - **author_industries?**: Array<string>
      - **target_linkedin_profiles?**: Array<string>
    -       - **company_domains_to_scrape?**: Array<string>
      - **target_persona?**: Array<string>
      - **target_persona_locations?**: Array<string>
      - **interested_by?**: object
        - **prospects?**: boolean
        - **customers?**: boolean
      - **keywords_for_social_detection?**: Array<string>
      - **author_roles?**: Array<string>
      - **author_industries?**: Array<string>
      - **target_linkedin_profiles?**: Array<string>
    -       - **influencer_keywords?**: Array<string>
      - **company_domains_to_scrape?**: Array<string>
      - **target_persona?**: Array<string>
      - **target_persona_locations?**: Array<string>
      - **interested_by?**: object
        - **prospects?**: boolean
        - **customers?**: boolean
      - **keywords_for_social_detection?**: Array<string>
      - **author_roles?**: Array<string>
      - **author_industries?**: Array<string>
      - **target_linkedin_profiles?**: Array<string>
    -       - **company_domains_to_scrape?**: Array<string>
      - **target_persona?**: Array<string>
      - **target_persona_locations?**: Array<string>
      - **interested_by?**: object
        - **prospects?**: boolean
        - **customers?**: boolean
      - **keywords_for_social_detection?**: Array<string>
      - **author_roles?**: Array<string>
      - **author_industries?**: Array<string>
      - **target_linkedin_profiles?**: Array<string>
    - object
    - object
    - object
    - object
    - object
  - **created_at?**: string
  - **updated_at?**: string
```

#### 401

#### 422 - Invalid request body, unsupported `type`, missing `tracking_keywords` for

`keyword_detection`, or `watchlist_id` references a list whose type does not
match the chosen agent type.

Also returned for every type except `job_update` and `deep_search` when the
workspace is not set up yet: no persona, a persona missing `job_title` or
`location`, or zero top accounts. The error message names the exact
prerequisite to fix (`sillage_v2_upsert_persona` and/or
`sillage_v2_add_top_accounts`) before retrying.

#### 429

#### 500

---

## GET /v2/agents

**List agents**

Returns a paginated list of your agents — keyword detection, job-posting keyword detection, job-change tracking, and watchlist monitors.

### Parameters

| Name      | In    | Type    | Required | Description                                        |
| --------- | ----- | ------- | -------- | -------------------------------------------------- |
| page      | query | integer | No       | Page number (starts at 1). Defaults to 1.          |
| page_size | query | integer | No       | Number of agents per page. Defaults to 10, max 25. |

### Responses

#### 200 - Paginated list of agents.

```
- **data**: Array<  - **id**: integer - Identifier of the agent.
  - **name**: string
  - **type**: string (keyword_detection, job_update, job_posting, job_posting_keyword_detection, competitor_activity, content_engagement, influencer_engagement, champion_tracking, competitor, partner, customer, influencer, champion, unconfigured) - The agent type. Watchlist agents return their semantic type (competitor, partner, customer, influencer, champion). `unconfigured` marks an agent that still needs to be set up — either its watchlist has not been defined yet, or its watchlist was unbound; its `parameters` is empty and `watchlist_kind`/`watchlist_id` are null. Bind a watchlist to give it a type again.
  - **enabled**: boolean - Whether the agent is currently active.
  - **watchlist_kind**: string | null (company, profile) - Kind of the bound watchlist, or null when unbound (paired with watchlist_id).
  - **watchlist_id**: integer | null - The bound watchlist id, or null when the agent is unbound.
  - **parameters**: oneOf:
    -       - **tracking_keywords?**: Array<string>
      - **start_date?**: string - ISO 8601 date, scrape only posts published after this date.
    -       - **tracking_keywords?**: Array<string>
    -       - **job_titles?**: Array<string>
      - **seniority_levels?**: Array<string>
      - **company_domains_to_scrape?**: Array<string>
      - **target_persona?**: Array<string>
      - **target_persona_locations?**: Array<string>
      - **interested_by?**: object
        - **prospects?**: boolean
        - **customers?**: boolean
      - **keywords_for_social_detection?**: Array<string>
      - **author_roles?**: Array<string>
      - **author_industries?**: Array<string>
      - **target_linkedin_profiles?**: Array<string>
    -       - **job_titles?**: Array<string>
      - **search_strings?**: Array<string>
      - **job_locations?**: Array<string>
      - **published_at?**: string
      - **target_top_accounts_only?**: boolean
    -       - **company_domains_to_scrape?**: Array<string>
      - **target_persona?**: Array<string>
      - **target_persona_locations?**: Array<string>
      - **interested_by?**: object
        - **prospects?**: boolean
        - **customers?**: boolean
      - **keywords_for_social_detection?**: Array<string>
      - **author_roles?**: Array<string>
      - **author_industries?**: Array<string>
      - **target_linkedin_profiles?**: Array<string>
    -       - **company_domains_to_scrape?**: Array<string>
      - **target_persona?**: Array<string>
      - **target_persona_locations?**: Array<string>
      - **interested_by?**: object
        - **prospects?**: boolean
        - **customers?**: boolean
      - **keywords_for_social_detection?**: Array<string>
      - **author_roles?**: Array<string>
      - **author_industries?**: Array<string>
      - **target_linkedin_profiles?**: Array<string>
    -       - **influencer_keywords?**: Array<string>
      - **company_domains_to_scrape?**: Array<string>
      - **target_persona?**: Array<string>
      - **target_persona_locations?**: Array<string>
      - **interested_by?**: object
        - **prospects?**: boolean
        - **customers?**: boolean
      - **keywords_for_social_detection?**: Array<string>
      - **author_roles?**: Array<string>
      - **author_industries?**: Array<string>
      - **target_linkedin_profiles?**: Array<string>
    -       - **company_domains_to_scrape?**: Array<string>
      - **target_persona?**: Array<string>
      - **target_persona_locations?**: Array<string>
      - **interested_by?**: object
        - **prospects?**: boolean
        - **customers?**: boolean
      - **keywords_for_social_detection?**: Array<string>
      - **author_roles?**: Array<string>
      - **author_industries?**: Array<string>
      - **target_linkedin_profiles?**: Array<string>
    - object
    - object
    - object
    - object
    - object
  - **created_at?**: string
  - **updated_at?**: string>
- **meta**: object
  - **pagination**: object
    - **page**: integer
    - **page_size**: integer
    - **page_count**: integer
    - **total**: integer
```

#### 401

#### 422 - Invalid `page` or `page_size` query parameter.

#### 429

#### 500

---

## GET /v2/agents/{agent_id}

**Get agent**

Returns a single agent by its numeric id, scoped to the authenticated workspace.

### Parameters

| Name     | In   | Type    | Required | Description              |
| -------- | ---- | ------- | -------- | ------------------------ |
| agent_id | path | integer | Yes      | Identifier of the agent. |

### Responses

#### 200 - Agent found.

```
- **data**: object
  - **id**: integer - Identifier of the agent.
  - **name**: string
  - **type**: string (keyword_detection, job_update, job_posting, job_posting_keyword_detection, competitor_activity, content_engagement, influencer_engagement, champion_tracking, competitor, partner, customer, influencer, champion, unconfigured) - The agent type. Watchlist agents return their semantic type (competitor, partner, customer, influencer, champion). `unconfigured` marks an agent that still needs to be set up — either its watchlist has not been defined yet, or its watchlist was unbound; its `parameters` is empty and `watchlist_kind`/`watchlist_id` are null. Bind a watchlist to give it a type again.
  - **enabled**: boolean - Whether the agent is currently active.
  - **watchlist_kind**: string | null (company, profile) - Kind of the bound watchlist, or null when unbound (paired with watchlist_id).
  - **watchlist_id**: integer | null - The bound watchlist id, or null when the agent is unbound.
  - **parameters**: oneOf:
    -       - **tracking_keywords?**: Array<string>
      - **start_date?**: string - ISO 8601 date, scrape only posts published after this date.
    -       - **tracking_keywords?**: Array<string>
    -       - **job_titles?**: Array<string>
      - **seniority_levels?**: Array<string>
      - **company_domains_to_scrape?**: Array<string>
      - **target_persona?**: Array<string>
      - **target_persona_locations?**: Array<string>
      - **interested_by?**: object
        - **prospects?**: boolean
        - **customers?**: boolean
      - **keywords_for_social_detection?**: Array<string>
      - **author_roles?**: Array<string>
      - **author_industries?**: Array<string>
      - **target_linkedin_profiles?**: Array<string>
    -       - **job_titles?**: Array<string>
      - **search_strings?**: Array<string>
      - **job_locations?**: Array<string>
      - **published_at?**: string
      - **target_top_accounts_only?**: boolean
    -       - **company_domains_to_scrape?**: Array<string>
      - **target_persona?**: Array<string>
      - **target_persona_locations?**: Array<string>
      - **interested_by?**: object
        - **prospects?**: boolean
        - **customers?**: boolean
      - **keywords_for_social_detection?**: Array<string>
      - **author_roles?**: Array<string>
      - **author_industries?**: Array<string>
      - **target_linkedin_profiles?**: Array<string>
    -       - **company_domains_to_scrape?**: Array<string>
      - **target_persona?**: Array<string>
      - **target_persona_locations?**: Array<string>
      - **interested_by?**: object
        - **prospects?**: boolean
        - **customers?**: boolean
      - **keywords_for_social_detection?**: Array<string>
      - **author_roles?**: Array<string>
      - **author_industries?**: Array<string>
      - **target_linkedin_profiles?**: Array<string>
    -       - **influencer_keywords?**: Array<string>
      - **company_domains_to_scrape?**: Array<string>
      - **target_persona?**: Array<string>
      - **target_persona_locations?**: Array<string>
      - **interested_by?**: object
        - **prospects?**: boolean
        - **customers?**: boolean
      - **keywords_for_social_detection?**: Array<string>
      - **author_roles?**: Array<string>
      - **author_industries?**: Array<string>
      - **target_linkedin_profiles?**: Array<string>
    -       - **company_domains_to_scrape?**: Array<string>
      - **target_persona?**: Array<string>
      - **target_persona_locations?**: Array<string>
      - **interested_by?**: object
        - **prospects?**: boolean
        - **customers?**: boolean
      - **keywords_for_social_detection?**: Array<string>
      - **author_roles?**: Array<string>
      - **author_industries?**: Array<string>
      - **target_linkedin_profiles?**: Array<string>
    - object
    - object
    - object
    - object
    - object
  - **created_at?**: string
  - **updated_at?**: string
```

#### 401

#### 404

#### 422 - Invalid `agent_id`, must be a positive integer.

#### 429

#### 500

---

## PUT /v2/agents/{agent_id}

**Update agent**

Partially updates an agent. All fields are optional, send only the ones to change.

Changing `parameters` creates a new immutable campaign-setting version
and repoints the agent to it. Changing only `name` or `enabled` mutates the agent
row directly without creating a new version.

### Parameters

| Name     | In   | Type    | Required | Description             |
| -------- | ---- | ------- | -------- | ----------------------- |
| agent_id | path | integer | Yes      | Identifier of the agent |

### Request Body

```
- **name?**: string
- **enabled?**: boolean - Enable or disable the agent.
- **parameters?**: object
  - **tracking_keywords?**: Array<string> - Keywords this agent looks for in LinkedIn posts. Minimum 1 required. A bare keyword matches broadly, including inside longer words and phrases, which finds more posts but adds noise. Wrap a keyword in double quotes (for example "machine learning") to match that exact phrase only, which cuts noise and sharpens precision.
  - **start_date?**: string - ISO 8601 date, scrape only posts published after this date.
- **watchlist_kind?**: string | null (company, profile) - Optional. Kind of the watchlist to bind. Derived from the agent type when omitted alongside watchlist_id. Providing a kind that contradicts the agent type returns 422. Null (alongside null watchlist_id) to unbind.
- **watchlist_id?**: integer | null - Bind the agent to a watchlist. watchlist_kind is optional, the kind is derived from the agent type when omitted. Null (both fields null) to unbind.
```

### Responses

#### 200 - Agent updated.

```
- **data**: object
  - **id**: integer - Identifier of the agent.
  - **name**: string
  - **type**: string (keyword_detection, job_update, job_posting, job_posting_keyword_detection, competitor_activity, content_engagement, influencer_engagement, champion_tracking, competitor, partner, customer, influencer, champion, unconfigured) - The agent type. Watchlist agents return their semantic type (competitor, partner, customer, influencer, champion). `unconfigured` marks an agent that still needs to be set up — either its watchlist has not been defined yet, or its watchlist was unbound; its `parameters` is empty and `watchlist_kind`/`watchlist_id` are null. Bind a watchlist to give it a type again.
  - **enabled**: boolean - Whether the agent is currently active.
  - **watchlist_kind**: string | null (company, profile) - Kind of the bound watchlist, or null when unbound (paired with watchlist_id).
  - **watchlist_id**: integer | null - The bound watchlist id, or null when the agent is unbound.
  - **parameters**: oneOf:
    -       - **tracking_keywords?**: Array<string>
      - **start_date?**: string - ISO 8601 date, scrape only posts published after this date.
    -       - **tracking_keywords?**: Array<string>
    -       - **job_titles?**: Array<string>
      - **seniority_levels?**: Array<string>
      - **company_domains_to_scrape?**: Array<string>
      - **target_persona?**: Array<string>
      - **target_persona_locations?**: Array<string>
      - **interested_by?**: object
        - **prospects?**: boolean
        - **customers?**: boolean
      - **keywords_for_social_detection?**: Array<string>
      - **author_roles?**: Array<string>
      - **author_industries?**: Array<string>
      - **target_linkedin_profiles?**: Array<string>
    -       - **job_titles?**: Array<string>
      - **search_strings?**: Array<string>
      - **job_locations?**: Array<string>
      - **published_at?**: string
      - **target_top_accounts_only?**: boolean
    -       - **company_domains_to_scrape?**: Array<string>
      - **target_persona?**: Array<string>
      - **target_persona_locations?**: Array<string>
      - **interested_by?**: object
        - **prospects?**: boolean
        - **customers?**: boolean
      - **keywords_for_social_detection?**: Array<string>
      - **author_roles?**: Array<string>
      - **author_industries?**: Array<string>
      - **target_linkedin_profiles?**: Array<string>
    -       - **company_domains_to_scrape?**: Array<string>
      - **target_persona?**: Array<string>
      - **target_persona_locations?**: Array<string>
      - **interested_by?**: object
        - **prospects?**: boolean
        - **customers?**: boolean
      - **keywords_for_social_detection?**: Array<string>
      - **author_roles?**: Array<string>
      - **author_industries?**: Array<string>
      - **target_linkedin_profiles?**: Array<string>
    -       - **influencer_keywords?**: Array<string>
      - **company_domains_to_scrape?**: Array<string>
      - **target_persona?**: Array<string>
      - **target_persona_locations?**: Array<string>
      - **interested_by?**: object
        - **prospects?**: boolean
        - **customers?**: boolean
      - **keywords_for_social_detection?**: Array<string>
      - **author_roles?**: Array<string>
      - **author_industries?**: Array<string>
      - **target_linkedin_profiles?**: Array<string>
    -       - **company_domains_to_scrape?**: Array<string>
      - **target_persona?**: Array<string>
      - **target_persona_locations?**: Array<string>
      - **interested_by?**: object
        - **prospects?**: boolean
        - **customers?**: boolean
      - **keywords_for_social_detection?**: Array<string>
      - **author_roles?**: Array<string>
      - **author_industries?**: Array<string>
      - **target_linkedin_profiles?**: Array<string>
    - object
    - object
    - object
    - object
    - object
  - **created_at?**: string
  - **updated_at?**: string
```

#### 401

#### 404

#### 422 - Invalid request body or `agent_id`, empty body, or `tracking_keywords` below minimum.

#### 429

#### 500

---

## DELETE /v2/agents/{agent_id}

**Delete agent**

Soft-deletes an agent. The agent is archived (`deleted_at` set, `enabled` set to false)
and no longer returned by the list or get endpoints.

Signal and detection data linked to the agent is preserved.

### Parameters

| Name     | In   | Type    | Required | Description             |
| -------- | ---- | ------- | -------- | ----------------------- |
| agent_id | path | integer | Yes      | Identifier of the agent |

### Responses

#### 200 - Agent deleted.

```
- **data**: object
  - **id**: integer - Identifier of the deleted agent.
```

#### 401

#### 404

#### 422 - Invalid `agent_id`, must be a positive integer.

#### 429

#### 500

---

## POST /v2/watchlists

**Create watchlist**

Creates a reusable, workspace-scoped watchlist. `kind` is derived from the immutable `type`.

### Request Body

```
- **type**: string (competitor, partner, customer, influencer, champion) - Immutable; determines the list kind.
- **title**: string
- **description?**: string
```

### Responses

#### 201 - The created watchlist.

```
- **data**: object
  - **id**: integer - Numeric identifier of the watchlist.
  - **kind**: string (company, profile) - Derived from `type` (read-only).
  - **type**: string (competitor, partner, customer, influencer, champion) - Immutable list type. competitor/partner/customer → a company list; influencer/champion → a profile list.
  - **title**: string
  - **description?**: string | null - Omitted in the `concise` response format.
  - **entity_count?**: integer - Member count. Omitted in `concise`.
  - **bound_agent_count?**: integer - Number of agents bound to this list. Omitted in `concise`.
```

#### 401

#### 422 - Invalid request body.

#### 429

#### 500

---

## GET /v2/watchlists

**List watchlists**

Returns a paginated list of the workspace's watchlists. The total is in `meta.pagination`.

### Parameters

| Name            | In    | Type                                                         | Required | Description                                                                                                                                                                 |
| --------------- | ----- | ------------------------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| page            | query | integer                                                      | No       | Page number (starts at 1). Defaults to 1.                                                                                                                                   |
| page_size       | query | integer                                                      | No       | Items per page. Defaults to 25, max 100.                                                                                                                                    |
| type            | query | string (competitor, partner, customer, influencer, champion) | No       | Optional filter by list type.                                                                                                                                               |
| response_format | query | string (concise, normalized, detailed)                       | No       | Verbosity: `concise` (id/kind/type/title only), `normalized` (default, adds description + counts), `detailed` (identical to normalized; watchlists carry no heavy payload). |

### Responses

#### 200 - Paginated watchlists.

```
- **data**: Array<  - **id**: integer - Numeric identifier of the watchlist.
  - **kind**: string (company, profile) - Derived from `type` (read-only).
  - **type**: string (competitor, partner, customer, influencer, champion) - Immutable list type. competitor/partner/customer → a company list; influencer/champion → a profile list.
  - **title**: string
  - **description?**: string | null - Omitted in the `concise` response format.
  - **entity_count?**: integer - Member count. Omitted in `concise`.
  - **bound_agent_count?**: integer - Number of agents bound to this list. Omitted in `concise`.>
- **meta**: object
  - **pagination**: object
    - **page**: integer
    - **page_size**: integer
    - **page_count**: integer
    - **total**: integer
```

#### 401

#### 422 - Invalid query parameters.

#### 429

#### 500

---

## GET /v2/watchlists/{kind}/{watchlist_id}

**Get watchlist**

Fetches one watchlist by its numeric id.

### Parameters

| Name            | In    | Type                                   | Required | Description                                                                                                                                                                 |
| --------------- | ----- | -------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| kind            | path  | string (company, profile)              | Yes      | The watchlist kind (company or profile), matching the list `type`. Part of the path so the company and profile id spaces never collide.                                     |
| watchlist_id    | path  | integer                                | Yes      | Identifier of the watchlist.                                                                                                                                                |
| response_format | query | string (concise, normalized, detailed) | No       | Verbosity: `concise` (id/kind/type/title only), `normalized` (default, adds description + counts), `detailed` (identical to normalized; watchlists carry no heavy payload). |

### Responses

#### 200 - The watchlist.

```
- **data**: object
  - **id**: integer - Numeric identifier of the watchlist.
  - **kind**: string (company, profile) - Derived from `type` (read-only).
  - **type**: string (competitor, partner, customer, influencer, champion) - Immutable list type. competitor/partner/customer → a company list; influencer/champion → a profile list.
  - **title**: string
  - **description?**: string | null - Omitted in the `concise` response format.
  - **entity_count?**: integer - Member count. Omitted in `concise`.
  - **bound_agent_count?**: integer - Number of agents bound to this list. Omitted in `concise`.
```

#### 401

#### 404

#### 422 - Invalid `watchlist_id`.

#### 429

#### 500

---

## PUT /v2/watchlists/{kind}/{watchlist_id}

**Update watchlist**

Updates the title and/or description. The list `type` is immutable.

### Parameters

| Name         | In   | Type                      | Required | Description                                                                                                                             |
| ------------ | ---- | ------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| kind         | path | string (company, profile) | Yes      | The watchlist kind (company or profile), matching the list `type`. Part of the path so the company and profile id spaces never collide. |
| watchlist_id | path | integer                   | Yes      | Identifier of the watchlist.                                                                                                            |

### Request Body

```
- **title?**: string
- **description?**: string | null - Pass null to clear.
```

### Responses

#### 200 - The updated watchlist.

```
- **data**: object
  - **id**: integer - Numeric identifier of the watchlist.
  - **kind**: string (company, profile) - Derived from `type` (read-only).
  - **type**: string (competitor, partner, customer, influencer, champion) - Immutable list type. competitor/partner/customer → a company list; influencer/champion → a profile list.
  - **title**: string
  - **description?**: string | null - Omitted in the `concise` response format.
  - **entity_count?**: integer - Member count. Omitted in `concise`.
  - **bound_agent_count?**: integer - Number of agents bound to this list. Omitted in `concise`.
```

#### 401

#### 404

#### 422 - Invalid `watchlist_id` or request body.

#### 429

#### 500

---

## DELETE /v2/watchlists/{kind}/{watchlist_id}

**Delete watchlist**

Deletes a watchlist. Fails with 409 if one or more agents are still bound to it.

### Parameters

| Name         | In   | Type                      | Required | Description                                                                                                                             |
| ------------ | ---- | ------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| kind         | path | string (company, profile) | Yes      | The watchlist kind (company or profile), matching the list `type`. Part of the path so the company and profile id spaces never collide. |
| watchlist_id | path | integer                   | Yes      | Identifier of the watchlist.                                                                                                            |

### Responses

#### 200 - The deleted watchlist id.

```
- **data**: object
  - **id**: integer
```

#### 401

#### 404

#### 409 - The watchlist is bound to one or more agents; unbind first.

#### 422 - Invalid `watchlist_id`.

#### 429

#### 500

---

## GET /v2/watchlists/{kind}/{watchlist_id}/entities

**List watchlist entities**

Returns a paginated list of the watchlist's members.

### Parameters

| Name            | In    | Type                                   | Required | Description                                                                                                                                                                 |
| --------------- | ----- | -------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| kind            | path  | string (company, profile)              | Yes      | The watchlist kind (company or profile), matching the list `type`. Part of the path so the company and profile id spaces never collide.                                     |
| watchlist_id    | path  | integer                                | Yes      | Identifier of the watchlist.                                                                                                                                                |
| page            | query | integer                                | No       | Page number (starts at 1). Defaults to 1.                                                                                                                                   |
| page_size       | query | integer                                | No       | Items per page. Defaults to 25, max 100.                                                                                                                                    |
| response_format | query | string (concise, normalized, detailed) | No       | Verbosity: `concise` (id/kind/type/title only), `normalized` (default, adds description + counts), `detailed` (identical to normalized; watchlists carry no heavy payload). |

### Responses

#### 200 - Paginated members.

```
- **data**: Array<  - **id**: integer - Numeric id of the canonical company or profile.
  - **name?**: string | null - Company members only.
  - **first_name?**: string | null - Profile members only.
  - **last_name?**: string | null - Profile members only.
  - **linkedin_handle?**: string | null
  - **linkedin_url?**: string | null>
- **meta**: object
  - **pagination**: object
    - **page**: integer
    - **page_size**: integer
    - **page_count**: integer
    - **total**: integer
```

#### 401

#### 404

#### 422 - Invalid `watchlist_id` or query parameters.

#### 429

#### 500

---

## POST /v2/watchlists/{kind}/{watchlist_id}/entities

**Add watchlist entities**

Adds members to a watchlist. Identify each entity by LinkedIn URL or handle (preferred). For company watchlists only, a `domain` is accepted as a fallback when no LinkedIn identifier is available.

The call is **partial-success**: members that were successfully added appear in `data`; per-entity failures appear in `errors`. A **200** response means the request was accepted, inspect `errors` to check for any per-entity failures. Re-adding members that are already present is safe and returns **200** with an empty `data` array. If **no** entities could be added because every one failed, the response is **422** with `data: []` and `errors` populated.

Providing a `domain` on a profile watchlist returns a hard **422**.

### Parameters

| Name         | In   | Type                      | Required | Description                                                                                                                             |
| ------------ | ---- | ------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| kind         | path | string (company, profile) | Yes      | The watchlist kind (company or profile), matching the list `type`. Part of the path so the company and profile id spaces never collide. |
| watchlist_id | path | integer                   | Yes      | Identifier of the watchlist.                                                                                                            |

### Request Body

```
- **entities**: Array<  - **linkedin_url?**: string
  - **linkedin_handle?**: string
  - **domain?**: string - Company domain (e.g. "stripe.com"). Accepted as a fallback for company watchlists only when no LinkedIn URL or handle is available. Providing a domain on a profile watchlist returns 422.>
```

### Responses

#### 200 - Request accepted. `data` contains any newly-added members (empty if all were already present); `errors` lists any per-entity failures.

```
- **data**: Array<  - **id**: integer - Numeric id of the canonical company or profile.
  - **name?**: string | null - Company members only.
  - **first_name?**: string | null - Profile members only.
  - **last_name?**: string | null - Profile members only.
  - **linkedin_handle?**: string | null
  - **linkedin_url?**: string | null>
- **errors**: Array<  - **input**: object - The entity input that failed.
    - **linkedin_url?**: string
    - **linkedin_handle?**: string
    - **domain?**: string
  - **code**: string (multiple_domain_matches, apollo_failed, resolution_failed) - `multiple_domain_matches`, the domain matched more than one company; `apollo_failed`, the company could not be resolved from its domain; `resolution_failed`, an unexpected error occurred during resolution.
  - **message**: string - Human-readable failure detail.> - Per-entity failures. Empty when all entities were added successfully.
```

#### 401

#### 404

#### 422 - No entities could be added because every one failed (see `errors` for details), the request body is invalid, or `domain` was provided on a profile watchlist. Re-adding already-present members returns 200, not 422.

```
- **data**: Array<  - **id**: integer - Numeric id of the canonical company or profile.
  - **name?**: string | null - Company members only.
  - **first_name?**: string | null - Profile members only.
  - **last_name?**: string | null - Profile members only.
  - **linkedin_handle?**: string | null
  - **linkedin_url?**: string | null>
- **errors**: Array<  - **input**: object - The entity input that failed.
    - **linkedin_url?**: string
    - **linkedin_handle?**: string
    - **domain?**: string
  - **code**: string (multiple_domain_matches, apollo_failed, resolution_failed) - `multiple_domain_matches`, the domain matched more than one company; `apollo_failed`, the company could not be resolved from its domain; `resolution_failed`, an unexpected error occurred during resolution.
  - **message**: string - Human-readable failure detail.>
```

#### 429

#### 500

---

## DELETE /v2/watchlists/{kind}/{watchlist_id}/entities/{entity_id}

**Remove watchlist entity**

Removes one member from a watchlist by its entity id.

### Parameters

| Name         | In   | Type                      | Required | Description                                                                                                                             |
| ------------ | ---- | ------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| kind         | path | string (company, profile) | Yes      | The watchlist kind (company or profile), matching the list `type`. Part of the path so the company and profile id spaces never collide. |
| watchlist_id | path | integer                   | Yes      | Identifier of the watchlist.                                                                                                            |
| entity_id    | path | integer                   | Yes      | Numeric id of the member (the `id` returned by the list-entities endpoint).                                                             |

### Responses

#### 200 - Removal result.

```
- **data**: object
  - **id**: integer
  - **deleted**: boolean
```

#### 401

#### 404

#### 422 - Invalid path parameters.

#### 429

#### 500

---

## Signal Data Schemas

### ProblemDetails

RFC 9457 error body. Returned with Content-Type: application/problem+json on every v2 error response.

- **type**: string - A URI that identifies the problem type. `about:blank` when the type is unspecified (e.g. 500).
- **title**: string - A short, human-readable summary of the problem type. Stable across occurrences.
- **status**: integer - The HTTP status code.
- **detail?**: string - A human-readable explanation specific to this occurrence.
- **instance?**: string - The request path that produced this error.
- **errors?**: object - Field-level validation errors. Present only on 400/422 validation failures.

### CompetitorActivityData

Interaction data for competitor activity signals

- **interaction**: object
  - **type?**: string (comment, reaction)
  - **url?**: string | null
  - **author?**: object
    - **full_name?**: string | null
    - **first_name?**: string | null
    - **last_name?**: string | null
    - **linkedin_url?**: string | null
    - **company_name?**: string | null
    - **role?**: string | null
    - **comment_text?**: string | null
- **post**: object
  - **url?**: string | null
  - **extract?**: string | null
  - **author?**: object
    - **full_name?**: string | null
    - **first_name?**: string | null
    - **last_name?**: string | null
    - **linkedin_url?**: string | null
    - **company_name?**: string | null
    - **role?**: string | null

### KeywordDetectionData

- **post**: object
  - **url?**: string | null
  - **extract?**: string | null
  - **author?**: object
    - **full_name?**: string | null
    - **headline?**: string | null
    - **linkedin_url?**: string | null
- **keywords_found**: Array<string>

### JobUpdateData

- **previous_position**: object
  - **role?**: string | null
  - **company_name?**: string | null
- **new_position**: object
  - **role?**: string | null
  - **company_name?**: string | null
  - **start_date?**: string | null - Start date of the new position in YYYY-MM-DD format (day may default to 01 when only month is available)

### ContentEngagementData

Interaction data for content engagement signals

- **interaction**: object
  - **type?**: string (comment, reaction)
  - **url?**: string | null
  - **author?**: object
    - **full_name?**: string | null
    - **first_name?**: string | null
    - **last_name?**: string | null
    - **linkedin_url?**: string | null
    - **company_name?**: string | null
    - **role?**: string | null
    - **comment_text?**: string | null
- **post**: object
  - **url?**: string | null
  - **extract?**: string | null
  - **author?**: object
    - **full_name?**: string | null
    - **first_name?**: string | null
    - **last_name?**: string | null
    - **linkedin_url?**: string | null
    - **company_name?**: string | null
    - **role?**: string | null

### InfluencerEngagementData

Interaction data for influencer engagement signals

- **interaction**: object
  - **type?**: string (comment, reaction)
  - **url?**: string | null
  - **author?**: object
    - **full_name?**: string | null
    - **first_name?**: string | null
    - **last_name?**: string | null
    - **linkedin_url?**: string | null
    - **company_name?**: string | null
    - **role?**: string | null
    - **comment_text?**: string | null
- **post**: object
  - **url?**: string | null
  - **extract?**: string | null
  - **author?**: object
    - **full_name?**: string | null
    - **first_name?**: string | null
    - **last_name?**: string | null
    - **linkedin_url?**: string | null
    - **company_name?**: string | null
    - **role?**: string | null

### DeepSearchData

Deep search signal data (AI-generated company intelligence)

- **title?**: string | null - Signal title
- **tag?**: string | null - Deep search signal subtype (e.g. funding, hiring, expansion)
- **date?**: string | null - Date of the event (YYYY-MM-DD)
- **sources?**: Array< - **url?**: string | null
  - **excerpts?**: Array<string>>

### JobPostingData

Job posting signal data

- **posting?**: object
  - **title?**: string | null
  - **company_name?**: string | null
  - **job_url?**: string | null
  - **location?**: string | null
  - **description?**: string | null
  - **published_at?**: string | null
- **job_title?**: string | null - Searched job title that matched this posting
- **insight?**: object - AI insight analysis result (only for job_posting_insight signals)
  - **is_match?**: boolean - Whether the posting matches the search criteria
  - **tag?**: string | null
  - **reasoning?**: string | null

### JobPostingKeywordDetectionData

Job posting keyword detection signal data

- **keywords_found?**: Array<string> - The tracked keywords found in the job posting
- **posting?**: object
  - **title?**: string | null - Title of the job posting
  - **job_url?**: string | null - Link to the job posting

### V2PaginationMeta

- **page**: integer - Current page number
- **page_size**: integer - Number of items per page
- **page_count**: integer - Total number of pages
- **total**: integer - Total number of matching items

### V2Company

- **id**: integer - Numeric SQL id of the company. Environment-specific, prod only, not portable across environments.
- **name?**: string | null
- **domain?**: string | null
- **linkedin_url?**: string | null

### V2CompanyDetail

Enrichment data for a company. All fields are nullable — a company that has not been enriched yet is returned with null enrichment fields.

- **name?**: string | null
- **domain?**: string | null
- **url?**: string | null - The company's website.
- **linkedin_url?**: string | null
- **linkedin_handle?**: string | null - LinkedIn company handle (slug).
- **logo_url?**: string | null
- **location?**: string | null
- **locations?**: Array< - **is_hq?**: boolean - True for the headquarters location.
  - **city?**: string | null
  - **region?**: string | null
  - **state?**: string | null
  - **country?**: string | null
  - **country_code?**: string | null - ISO country code.
  - **postal_code?**: string | null
  - **line1?**: string | null - First line of the street address.
  - **line2?**: string | null - Second line of the street address, if any.
  - **formatted_address?**: string | null - The full address as a single formatted string.
  - **latitude?**: number | null
  - **longitude?**: number | null> - The company's known locations, HQ first. `is_hq` marks the headquarters; every other entry is a secondary location.
- **number_of_employees?**: integer | null
- **employee_range?**: string | null - Employee headcount range, e.g. "51-200".
- **founded_year?**: integer | null
- **industries?**: string | null
- **activity_summary?**: string | null - A short summary of the company's activity.

### V2LeadDetail

A lead in the authenticated workspace, with its linked profile, a reference to its current company, and its LinkedIn work history. All fields are nullable — a lead with no linked profile, or with a profile that has no current company, is returned with those fields set to `null` rather than an error.

- **id**: integer - The lead id, as returned by the signals endpoints. Always use the `lead_id` value from those responses — don't guess, hard-code, or reuse an id from another workspace.
- **first_name?**: string | null
- **last_name?**: string | null
- **linkedin_url?**: string | null
- **linkedin_handle?**: string | null - LinkedIn profile handle (slug).
- **linkedin_headline?**: string | null
- **avatar_url?**: string | null
- **position?**: string | null - The lead's job title.
- **location?**: string | null
- **geo?**: object - The lead's location as structured data. `location` above is the same location as a display string; `geo` breaks it down into city, region, country, and ISO country code. `null` when no structured location could be resolved for this lead — not an error.
  - **city?**: string | null
  - **region?**: string | null
  - **country?**: string | null
  - **country_code?**: string | null - ISO country code.
- **company?**: object - The lead's current company, when one can be resolved. `null` when the lead has no linked profile, no current company, or that company is not tracked in your workspace.
  - **id**: integer - This company's ID in your workspace. Always use the `id` returned here — don't guess, hard-code, or copy it from another workspace — then pass it to `GET /v2/companies/{id}` to fetch its full enrichment data.
  - **name?**: string | null
  - **domain?**: string | null
  - **linkedin_url?**: string | null
  - **linkedin_handle?**: string | null
  - **activity_summary?**: string | null - A short summary of the company's activity.
  - **employee_range?**: string | null - Employee headcount range, e.g. "51-200".
  - **location?**: string | null
- **experiences?**: Array< - **title?**: string | null - Job title held in this position.
  - **company_name?**: string | null
  - **company_linkedin_url?**: string | null - The employer's LinkedIn page, when known.
  - **location?**: string | null
  - **start_date?**: string | null - When this position started.
  - **end_date?**: string | null - When this position ended. `null` for the current position or when the end date is unknown.
  - **is_current**: boolean - Whether this is the lead's current position.> - The lead's work history, in the order it appears on their LinkedIn profile, including their current position. `null` when this data is not available for this lead (for example, profiles that were not sourced from LinkedIn); an empty array means the profile has no work history listed.

### V2ContentAuthor

Who posted, commented, or reacted — a person or a company page.

- **type**: string (profile, company)
- **full_name?**: string - Present when `type` is `profile`.
- **headline?**: string | null - Present when `type` is `profile`.
- **company_name?**: string - Present when `type` is `company`.
- **linkedin_url?**: string

### V2ContentMention

- **name?**: string
- **linkedin_url?**: string

### V2ContentEmbeddedPost

The post a reaction was made on.

- **post_id?**: string
- **link?**: string
- **text?**: string
- **author?**: object - Who posted, commented, or reacted — a person or a company page.
  - **type**: string (profile, company)
  - **full_name?**: string - Present when `type` is `profile`.
  - **headline?**: string | null - Present when `type` is `profile`.
  - **company_name?**: string - Present when `type` is `company`.
  - **linkedin_url?**: string

### V2ContentData

What this content item is about. Shape depends on `content_type`; every field is
included only when we could extract it, so treat all fields as optional.

- LinkedIn posts (`linkedinPost`, `linkedinCompanyPost`): `post_id`, `original_post_id`
  (set when this is a repost), `is_repost`, `link`, `text` (full text, never truncated),
  `posted_at`, `engagement`, `author`, `mentions` (`{ profiles: [...], companies: [...] }`),
  `images` (array of URLs).
- LinkedIn comments (`linkedinComment`): `linkedin_id` (the comment's own LinkedIn id,
  when we have it), `text`, `linkedin_url`, `posted_at`, `engagement`, `author`, and
  `post_content_id` — the numeric id of the commented post in your contents (fetch it
  via the Contents endpoints), `null` when that post is not among your contents.
- `engagement` is the same flat shape for both posts and comments: `likes`, `comments`
  (replies, for a comment), `shares` (posts only), and a per-reaction-type breakdown —
  `praise`, `empathy`, `interest`, `appreciation` — whenever the source exposes it.
- LinkedIn reactions (`linkedinReaction`): `reaction_type` (e.g. `LIKE`), `author`,
  and `post` — the parent post being reacted to.
- LinkedIn job postings (`linkedinJobPosting`): `linkedin_id`, `linkedin_url`, `title`, `min_salary`,
  `max_salary` (a number or a free-text string such as `"$100K/yr"`, when disclosed),
  `location`, `posted_at`, `description` (full text).
- Every other content type: `text` when we have it, omitted otherwise.

- **linkedin_id?**: string - The item's own LinkedIn id (a comment or a job posting) — not to be confused with this content item's own `id` at the top level.
- **post_id?**: string
- **original_post_id?**: string | null
- **is_repost?**: boolean
- **link?**: string
- **text?**: string
- **posted_at?**: string
- **reaction_type?**: string
- **engagement?**: object - Same flat shape for posts and comments. `shares` is posts only; `comments` means comments on a post, or replies to a comment. The reaction breakdown (`praise`/`empathy`/`interest`/`appreciation`) is present whenever the source exposes it.
  - **likes?**: integer
  - **comments?**: integer - Number of comments on a post, or number of replies to a comment.
  - **shares?**: integer - Posts only.
  - **praise?**: integer
  - **empathy?**: integer
  - **interest?**: integer
  - **appreciation?**: integer
- **author?**: object - Who posted, commented, or reacted — a person or a company page.
  - **type**: string (profile, company)
  - **full_name?**: string - Present when `type` is `profile`.
  - **headline?**: string | null - Present when `type` is `profile`.
  - **company_name?**: string - Present when `type` is `company`.
  - **linkedin_url?**: string
- **mentions?**: object
  - **profiles?**: Array< - **name?**: string
    - **linkedin_url?**: string>
  - **companies?**: Array< - **name?**: string
    - **linkedin_url?**: string>
- **images?**: Array<string>
- **post?**: object - The post a reaction was made on.
  - **post_id?**: string
  - **link?**: string
  - **text?**: string
  - **author?**: object - Who posted, commented, or reacted — a person or a company page.
    - **type**: string (profile, company)
    - **full_name?**: string - Present when `type` is `profile`.
    - **headline?**: string | null - Present when `type` is `profile`.
    - **company_name?**: string - Present when `type` is `company`.
    - **linkedin_url?**: string
- **post_content_id?**: integer | null - Comments only — the id of the commented post in your contents, usable with the Contents endpoints. `null` when that post is not among your contents.
- **linkedin_url?**: string - URL of the item on LinkedIn (comment or job posting).
- **title?**: string - Job posting title.
- **min_salary?**: oneOf:
  - number
  - string - Minimum disclosed salary, when available.
- **max_salary?**: oneOf:
  - number
  - string - Maximum disclosed salary, when available.
- **location?**: string - Job posting location.
- **description?**: string - Full job posting description.

### V2ContentItem

- **id**: integer - Numeric SQL id of the content item. Environment-specific, prod only, not portable across environments.
- **content_type**: string - Content type.
- **created_at**: string - When the content record was created.
- **data?**: object - What this content item is about. Shape depends on `content_type`; every field is
  included only when we could extract it, so treat all fields as optional.

- LinkedIn posts (`linkedinPost`, `linkedinCompanyPost`): `post_id`, `original_post_id`
  (set when this is a repost), `is_repost`, `link`, `text` (full text, never truncated),
  `posted_at`, `engagement`, `author`, `mentions` (`{ profiles: [...], companies: [...] }`),
  `images` (array of URLs).
- LinkedIn comments (`linkedinComment`): `linkedin_id` (the comment's own LinkedIn id,
  when we have it), `text`, `linkedin_url`, `posted_at`, `engagement`, `author`, and
  `post_content_id` — the numeric id of the commented post in your contents (fetch it
  via the Contents endpoints), `null` when that post is not among your contents.
- `engagement` is the same flat shape for both posts and comments: `likes`, `comments`
  (replies, for a comment), `shares` (posts only), and a per-reaction-type breakdown —
  `praise`, `empathy`, `interest`, `appreciation` — whenever the source exposes it.
- LinkedIn reactions (`linkedinReaction`): `reaction_type` (e.g. `LIKE`), `author`,
  and `post` — the parent post being reacted to.
- LinkedIn job postings (`linkedinJobPosting`): `linkedin_id`, `linkedin_url`, `title`, `min_salary`,
  `max_salary` (a number or a free-text string such as `"$100K/yr"`, when disclosed),
  `location`, `posted_at`, `description` (full text).
- Every other content type: `text` when we have it, omitted otherwise.
  - **linkedin_id?**: string - The item's own LinkedIn id (a comment or a job posting) — not to be confused with this content item's own `id` at the top level.
  - **post_id?**: string
  - **original_post_id?**: string | null
  - **is_repost?**: boolean
  - **link?**: string
  - **text?**: string
  - **posted_at?**: string
  - **reaction_type?**: string
  - **engagement?**: object - Same flat shape for posts and comments. `shares` is posts only; `comments` means comments on a post, or replies to a comment. The reaction breakdown (`praise`/`empathy`/`interest`/`appreciation`) is present whenever the source exposes it.
    - **likes?**: integer
    - **comments?**: integer - Number of comments on a post, or number of replies to a comment.
    - **shares?**: integer - Posts only.
    - **praise?**: integer
    - **empathy?**: integer
    - **interest?**: integer
    - **appreciation?**: integer
  - **author?**: object - Who posted, commented, or reacted — a person or a company page.
    - **type**: string (profile, company)
    - **full_name?**: string - Present when `type` is `profile`.
    - **headline?**: string | null - Present when `type` is `profile`.
    - **company_name?**: string - Present when `type` is `company`.
    - **linkedin_url?**: string
  - **mentions?**: object
    - **profiles?**: Array< - **name?**: string
      - **linkedin_url?**: string>
    - **companies?**: Array< - **name?**: string
      - **linkedin_url?**: string>
  - **images?**: Array<string>
  - **post?**: object - The post a reaction was made on.
    - **post_id?**: string
    - **link?**: string
    - **text?**: string
    - **author?**: object - Who posted, commented, or reacted — a person or a company page.
      - **type**: string (profile, company)
      - **full_name?**: string - Present when `type` is `profile`.
      - **headline?**: string | null - Present when `type` is `profile`.
      - **company_name?**: string - Present when `type` is `company`.
      - **linkedin_url?**: string
  - **post_content_id?**: integer | null - Comments only — the id of the commented post in your contents, usable with the Contents endpoints. `null` when that post is not among your contents.
  - **linkedin_url?**: string - URL of the item on LinkedIn (comment or job posting).
  - **title?**: string - Job posting title.
  - **min_salary?**: oneOf:
    - number
    - string - Minimum disclosed salary, when available.
  - **max_salary?**: oneOf:
    - number
    - string - Maximum disclosed salary, when available.
  - **location?**: string - Job posting location.
  - **description?**: string - Full job posting description.
- **lead_id**: integer | null - Numeric SQL id of the lead who posted, commented, or reacted, when they are one of your leads. Environment-specific, prod only.
- **company_id**: integer | null - The associated company's ID in Sillage. `null` when the company is not on your target account list.

### V2ContentsPaginatedResponse

- **data**: Array< - **id**: integer - Numeric SQL id of the content item. Environment-specific, prod only, not portable across environments.
  - **content_type**: string - Content type.
  - **created_at**: string - When the content record was created.
  - **data?**: object - What this content item is about. Shape depends on `content_type`; every field is
    included only when we could extract it, so treat all fields as optional.

- LinkedIn posts (`linkedinPost`, `linkedinCompanyPost`): `post_id`, `original_post_id`
  (set when this is a repost), `is_repost`, `link`, `text` (full text, never truncated),
  `posted_at`, `engagement`, `author`, `mentions` (`{ profiles: [...], companies: [...] }`),
  `images` (array of URLs).
- LinkedIn comments (`linkedinComment`): `linkedin_id` (the comment's own LinkedIn id,
  when we have it), `text`, `linkedin_url`, `posted_at`, `engagement`, `author`, and
  `post_content_id` — the numeric id of the commented post in your contents (fetch it
  via the Contents endpoints), `null` when that post is not among your contents.
- `engagement` is the same flat shape for both posts and comments: `likes`, `comments`
  (replies, for a comment), `shares` (posts only), and a per-reaction-type breakdown —
  `praise`, `empathy`, `interest`, `appreciation` — whenever the source exposes it.
- LinkedIn reactions (`linkedinReaction`): `reaction_type` (e.g. `LIKE`), `author`,
  and `post` — the parent post being reacted to.
- LinkedIn job postings (`linkedinJobPosting`): `linkedin_id`, `linkedin_url`, `title`, `min_salary`,
  `max_salary` (a number or a free-text string such as `"$100K/yr"`, when disclosed),
  `location`, `posted_at`, `description` (full text).
- Every other content type: `text` when we have it, omitted otherwise.
  - **linkedin_id?**: string - The item's own LinkedIn id (a comment or a job posting) — not to be confused with this content item's own `id` at the top level.
  - **post_id?**: string
  - **original_post_id?**: string | null
  - **is_repost?**: boolean
  - **link?**: string
  - **text?**: string
  - **posted_at?**: string
  - **reaction_type?**: string
  - **engagement?**: object - Same flat shape for posts and comments. `shares` is posts only; `comments` means comments on a post, or replies to a comment. The reaction breakdown (`praise`/`empathy`/`interest`/`appreciation`) is present whenever the source exposes it.
    - **likes?**: integer
    - **comments?**: integer - Number of comments on a post, or number of replies to a comment.
    - **shares?**: integer - Posts only.
    - **praise?**: integer
    - **empathy?**: integer
    - **interest?**: integer
    - **appreciation?**: integer
  - **author?**: object - Who posted, commented, or reacted — a person or a company page.
    - **type**: string (profile, company)
    - **full_name?**: string - Present when `type` is `profile`.
    - **headline?**: string | null - Present when `type` is `profile`.
    - **company_name?**: string - Present when `type` is `company`.
    - **linkedin_url?**: string
  - **mentions?**: object
    - **profiles?**: Array< - **name?**: string
      - **linkedin_url?**: string>
    - **companies?**: Array< - **name?**: string
      - **linkedin_url?**: string>
  - **images?**: Array<string>
  - **post?**: object - The post a reaction was made on.
    - **post_id?**: string
    - **link?**: string
    - **text?**: string
    - **author?**: object - Who posted, commented, or reacted — a person or a company page.
      - **type**: string (profile, company)
      - **full_name?**: string - Present when `type` is `profile`.
      - **headline?**: string | null - Present when `type` is `profile`.
      - **company_name?**: string - Present when `type` is `company`.
      - **linkedin_url?**: string
  - **post_content_id?**: integer | null - Comments only — the id of the commented post in your contents, usable with the Contents endpoints. `null` when that post is not among your contents.
  - **linkedin_url?**: string - URL of the item on LinkedIn (comment or job posting).
  - **title?**: string - Job posting title.
  - **min_salary?**: oneOf:
    - number
    - string - Minimum disclosed salary, when available.
  - **max_salary?**: oneOf:
    - number
    - string - Maximum disclosed salary, when available.
  - **location?**: string - Job posting location.
  - **description?**: string - Full job posting description.
  - **lead_id**: integer | null - Numeric SQL id of the lead who posted, commented, or reacted, when they are one of your leads. Environment-specific, prod only.
  - **company_id**: integer | null - The associated company's ID in Sillage. `null` when the company is not on your target account list.>
- **meta**: object
  - **pagination**: object
    - **page**: integer - Current page number
    - **page_size**: integer - Number of items per page
    - **page_count**: integer - Total number of pages
    - **total**: integer - Total number of matching items
  - **resolved_companies**: Array< - **company_id**: integer - The matched company's ID in Sillage.
    - **matched_by**: string (company_id, linkedin_handle, linkedin_url, domain) - Which identifier tier produced this match.
    - **identifier**: string - The original identifier value supplied by the caller (domain, handle, URL, or numeric id echoed as a string).> - Companies resolved from the company filter (`company_id`, `company_domain`, `company_linkedin_handle`, or `company_linkedin_url`). Empty when no company filter was supplied. Each entry reflects the winning tier for this request.

### V2ContentRequestItem

- **id**: integer - Numeric SQL id of the content request. Environment-specific, prod only, not portable across environments.
- **type**: string (account_mapping, top_account_content) - Request type.
- **stage**: string (account_mapping_ready, account_mapping_in_progress, account_mapping_ingestion_ready, account_mapping_ingestion_in_progress, account_mapping_failed, completed, top_account_content_scraping_ready, top_account_content_scraping_starting, top_account_content_scraping_in_progress, top_account_content_ingestion_in_progress, top_account_content_failed) - Current processing stage.
- **created_at**: string - When the request was created.
- **updated_at**: string - When the request was last updated.
- **company?**: object
  - **id**: integer - Numeric SQL id of the company. Environment-specific, prod only, not portable across environments.
  - **name?**: string | null
  - **domain?**: string | null
  - **linkedin_url?**: string | null
- **inputs?**: any - Request-type-specific input payload.

### V2ContentRequestsPaginatedResponse

- **data**: Array< - **id**: integer - Numeric SQL id of the content request. Environment-specific, prod only, not portable across environments.
  - **type**: string (account_mapping, top_account_content) - Request type.
  - **stage**: string (account_mapping_ready, account_mapping_in_progress, account_mapping_ingestion_ready, account_mapping_ingestion_in_progress, account_mapping_failed, completed, top_account_content_scraping_ready, top_account_content_scraping_starting, top_account_content_scraping_in_progress, top_account_content_ingestion_in_progress, top_account_content_failed) - Current processing stage.
  - **created_at**: string - When the request was created.
  - **updated_at**: string - When the request was last updated.
  - **company?**: object
    - **id**: integer - Numeric SQL id of the company. Environment-specific, prod only, not portable across environments.
    - **name?**: string | null
    - **domain?**: string | null
    - **linkedin_url?**: string | null
  - **inputs?**: any - Request-type-specific input payload.>
- **meta**: object
  - **pagination**: object
    - **page**: integer - Current page number
    - **page_size**: integer - Number of items per page
    - **page_count**: integer - Total number of pages
    - **total**: integer - Total number of matching items
  - **resolved_companies**: Array< - **company_id**: integer - The matched company's ID in Sillage.
    - **matched_by**: string (company_id, linkedin_handle, linkedin_url, domain) - Which identifier tier produced this match.
    - **identifier**: string - The original identifier value supplied by the caller (domain, handle, URL, or numeric id echoed as a string).> - Companies resolved from the company filter. Same semantics as in `V2ContentsPaginatedResponse`.

### V2ContentRequestStatusItem

A single in-flight enrichment job, with its status and the company it is running for.

- **id**: integer - Numeric ID of the content request. This ID is specific to your environment.
- **status**: string (pending, in_progress) - Normalized status of the request. `"pending"` means waiting to start; `"in_progress"` means actively processing. Failed and completed requests are excluded from this endpoint.
- **label**: string - Human-readable description of the current stage, safe to show to a user (e.g. "Gathering content for your accounts").
- **created_at**: string - When the request was created.
- **updated_at**: string - When the request was last updated.
- **company**: object - The company this request is running for. `null` for workspace-wide requests.
  - **id**: integer - Numeric ID of the company. Specific to your environment.
  - **name**: string | null
  - **domain**: string | null

### V2SignalRequestStatusItem

A single in-flight signal run, with its status and the accounts being scanned.

- **id**: integer - Numeric ID of the signal run. This ID is specific to your environment.
- **status**: string (pending, in_progress) - Normalized status of the run. `"pending"` means waiting to start; `"in_progress"` means actively processing. Failed and completed runs are excluded from this endpoint.
- **label**: string - Human-readable description of the run's current stage, safe to show to a user (e.g. "Detecting signals").
- **created_at**: string - When the run was started.
- **updated_at**: string - When the run was last updated.
- **scope**: string (company, workspace) - `"company"` when the run targets specific accounts (companies array will be populated). `"workspace"` when it spans the whole workspace — companies will be empty, which is expected, not missing data.
- **companies**: Array< - **id**: integer - Numeric ID of the company. Specific to your environment.
  - **name**: string | null
  - **domain**: string | null> - The accounts being scanned in this run. Empty when `scope` is `"workspace"`.

### V2ResolvedCompany

A company matched from a company filter. All entries in a response share the same `matched_by` value (single winning tier per request).

- **company_id**: integer - The matched company's ID in Sillage.
- **matched_by**: string (company_id, linkedin_handle, linkedin_url, domain) - Which identifier tier produced this match.
- **identifier**: string - The original identifier value supplied by the caller (domain, handle, URL, or numeric id echoed as a string).

### V2ContentsQueryBody

POST body for `POST /v2/contents/query`. All fields are optional.

- **page?**: integer - Page number (starts at 1). Defaults to 1.
- **page_size?**: integer - Number of items per page. Defaults to 25. Maximum: 100.
- **date_from?**: string - Filter contents created on or after this date (ISO 8601).
- **date_to?**: string - Filter contents created on or before this date (ISO 8601).
- **content_type?**: Array<string (linkedinComment, recentlyPromoted, linkedinPost, linkedinCompanyPost, linkedinJobPosting, webArticle, pressRelease, blogPost)> - Filter by content type. Native JSON array.
- **company_id?**: integer - Filter by the company's ID in Sillage. Takes priority over all human-identifier fields.
- **company_domain?**: Array<string> - Filter by company domain(s). Native JSON array. Maximum 100 values. Human identifiers are resolved to company IDs using a single-winning-tier waterfall: `company_id` > `company_linkedin_handle` > `company_linkedin_url` > `company_domain`. Only the highest-priority supplied tier is used; lower tiers are ignored. Multi-value = union within the winning tier.
- **company_linkedin_handle?**: Array<string> - Filter by company LinkedIn handle(s). Native JSON array. Maximum 100 values. See `company_domain` for tier priority.
- **company_linkedin_url?**: Array<string> - Filter by company LinkedIn URL(s). Native JSON array. Maximum 100 values. See `company_domain` for tier priority.
- **lead_id?**: integer - Filter for content authored by one lead. Use the `lead_id` shown on each content item, returned by the signals endpoints, or from the lead lookup endpoint.
- **response_format?**: string (concise, normalized, detailed) - Controls how much detail the `data` field of each item includes. `normalized` (default): a clean, stable projection of the content. `concise`: `data` is omitted entirely. Lowest token footprint. `detailed`: deprecated alias of `normalized`, kept for backward compatibility.

### V2ContentRequestsQueryBody

POST body for `POST /v2/content-requests/query`. All fields are optional.

- **page?**: integer - Page number (starts at 1). Defaults to 1.
- **page_size?**: integer - Number of items per page. Defaults to 25. Maximum: 100.
- **date_from?**: string - Filter by creation date on or after this date (ISO 8601).
- **date_to?**: string - Filter by creation date on or before this date (ISO 8601).
- **type?**: string (account_mapping, top_account_content) - Filter by request type.
- **stage?**: Array<string (account_mapping_ready, account_mapping_in_progress, account_mapping_ingestion_ready, account_mapping_ingestion_in_progress, account_mapping_failed, completed, top_account_content_mapping_in_progress, top_account_content_scraping_ready, top_account_content_scraping_starting, top_account_content_scraping_in_progress, top_account_content_ingestion_in_progress, top_account_content_failed)> - Filter by stage. Defaults to all stages except `completed`. Native JSON array.
- **company_id?**: integer - Filter by the company's ID in Sillage. Takes priority over all human-identifier fields.
- **company_domain?**: Array<string> - Filter by company domain(s). Native JSON array. Maximum 100 values. See `company_id` for tier priority.
- **company_linkedin_handle?**: Array<string> - Filter by company LinkedIn handle(s). Native JSON array. Maximum 100 values.
- **company_linkedin_url?**: Array<string> - Filter by company LinkedIn URL(s). Native JSON array. Maximum 100 values.

### V2EnrichedAccount

- **id?**: integer - Identifier of the enriched account.
- **company_id?**: integer - The company's ID in Sillage (same as `id`).
- **company**: object
  - **name?**: string
  - **domain?**: string
  - **linkedin_url?**: string
  - **linkedin_handle?**: string
  - **logo_url?**: string
  - **status**: string (found, not_found)
- **imported_at**: string

### V2SignalRunLaunchResponse

One element per detection run started. Keyword agents return one element; watchlist agents return one element per direction (inbound and outbound).

Array<- **signal_request_id**: integer - ID of the created run. Use as `{id}` in the poll endpoint. This ID is specific to your environment.

- **stage**: string (running) - Always `running` on a successful launch.>

### V2SignalRunPollResponse

- **signal_request_id**: integer - ID of the run.
- **stage**: string (waiting, running, completed, completed_partial, failed) - Current stage of the signal run.
- **metadata**: object - Extra details about a partially-covered run: the accounts that were not scanned. `null` when every account was scanned, or when the run failed entirely, in that case `stage` is `failed`.
  - **failed**: object
    - **dropped_account_ids**: Array<integer> - Accounts that were not scanned in this run. Retry the run to cover them. Each id is specific to your environment.

### V2SignalAuthorProfile

A person who published content.

- **type**: string (profile)
- **full_name?**: string | null
- **headline?**: string | null - LinkedIn headline of the person.
- **linkedin_url?**: string | null

### V2SignalAuthorCompany

A company page that published content.

- **type**: string (company)
- **company_name?**: string | null
- **linkedin_url?**: string | null

### V2KeywordDetectionData

Payload for `keywordDetection` signals: a post matching one of your tracked keywords.

- **content_id?**: integer | null - ID of the content the keyword matched in. Fetch the full post via the Contents endpoints.
- **author?**: oneOf:
  -     - **type**: string (profile)

    - **full_name?**: string | null
    - **headline?**: string | null - LinkedIn headline of the person.
    - **linkedin_url?**: string | null
  -     - **type**: string (company)

    - **company_name?**: string | null
    - **linkedin_url?**: string | null - Who published the post — a person or a company page (discriminated by `type`). Null when the publisher is unknown.
- **keywords_found?**: Array<string> - The tracked keywords found in the post.

### V2WatchlistCommentAuthor

A person involved in a watchlist comment interaction.

- **full_name?**: string | null
- **linkedin_url?**: string | null
- **headline?**: string | null - LinkedIn headline of the person.

### V2WatchlistCommentData

Payload for watchlist comment signals (signal types ending in `InboundComment` or `OutboundComment`): a comment (`interaction`) left on a post (`post`). Each side carries a `content_id` usable with the Contents endpoints — null when no matching content exists in your workspace.

- **interaction?**: object - The comment side of the interaction.
  - **type?**: string (comment)
  - **content_id?**: integer | null
  - **author?**: object - A person involved in a watchlist comment interaction.
    - **full_name?**: string | null
    - **linkedin_url?**: string | null
    - **headline?**: string | null - LinkedIn headline of the person.
- **post?**: object - The post the comment was left on.
  - **content_id?**: integer | null
  - **author?**: object - A person involved in a watchlist comment interaction.
    - **full_name?**: string | null
    - **linkedin_url?**: string | null
    - **headline?**: string | null - LinkedIn headline of the person.

### V2JobUpdateData

Payload for `newJob` and `recentlyPromoted` signals: a person started a new position.

- **previous_position?**: object - The role held before the change — fields are null when unknown.
  - **role?**: string | null
  - **company_name?**: string | null
- **new_position?**: object - The new role.
  - **role?**: string | null
  - **company_name?**: string | null
  - **start_date?**: string | null - Start date as YYYY-MM-DD.

### V2DeepSearchData

Payload for `deepSearch` signals: a company event found on the web.

- **title?**: string | null
- **tag?**: string | null - Category of the event (e.g. funding).
- **date?**: string | null
- **sources?**: Array< - **url?**: string | null
  - **excerpts?**: Array<string>>

### V2JobPostingData

Payload for `jobPosting`, `jobPostingInsight` and `jobPostingHiringManager` signals: an open role at a tracked company.

- **posting?**: object
  - **title?**: string | null
  - **company_name?**: string | null
  - **job_url?**: string | null
  - **location?**: string | null
  - **description?**: string | null
  - **published_at?**: string | null
- **job_title?**: string | null

### V2SignalDetection

- **id**: integer - ID of the detection. Specific to your environment.
- **signal_type?**: string | null - Signal type, e.g. "keywordDetection".
- **data?**: oneOf:
  -     - **content_id?**: integer | null - ID of the content the keyword matched in. Fetch the full post via the Contents endpoints.

    - **author?**: oneOf:
      -         - **type**: string (profile)

        - **full_name?**: string | null
        - **headline?**: string | null - LinkedIn headline of the person.
        - **linkedin_url?**: string | null
      -         - **type**: string (company)

        - **company_name?**: string | null
        - **linkedin_url?**: string | null - Who published the post — a person or a company page (discriminated by `type`). Null when the publisher is unknown.
    - **keywords_found?**: Array<string> - The tracked keywords found in the post.
  -     - **interaction?**: object - The comment side of the interaction.

    - **type?**: string (comment)
    - **content_id?**: integer | null
    - **author?**: object - A person involved in a watchlist comment interaction.
      - **full_name?**: string | null
      - **linkedin_url?**: string | null
      - **headline?**: string | null - LinkedIn headline of the person.
    - **post?**: object - The post the comment was left on.
      - **content_id?**: integer | null
      - **author?**: object - A person involved in a watchlist comment interaction.
        - **full_name?**: string | null
        - **linkedin_url?**: string | null
        - **headline?**: string | null - LinkedIn headline of the person.
  -     - **previous_position?**: object - The role held before the change — fields are null when unknown.

    - **role?**: string | null
    - **company_name?**: string | null
    - **new_position?**: object - The new role.
      - **role?**: string | null
      - **company_name?**: string | null
      - **start_date?**: string | null - Start date as YYYY-MM-DD.
  -     - **title?**: string | null

    - **tag?**: string | null - Category of the event (e.g. funding).
    - **date?**: string | null
    - **sources?**: Array< - **url?**: string | null
      - **excerpts?**: Array<string>>
  -     - **posting?**: object

    - **title?**: string | null
    - **company_name?**: string | null
    - **job_url?**: string | null
    - **location?**: string | null
    - **description?**: string | null
    - **published_at?**: string | null
    - **job_title?**: string | null - Detection payload — the shape depends on `signal_type`:
- `keywordDetection` → `V2KeywordDetectionData`
- `*InboundComment` / `*OutboundComment` (watchlist) → `V2WatchlistCommentData`
- `newJob`, `recentlyPromoted` → `V2JobUpdateData`
- `deepSearch` → `V2DeepSearchData`
- `jobPosting`, `jobPostingInsight`, `jobPostingHiringManager` → `V2JobPostingData`

Other signal types return their payload as-is.

- **detected_at?**: string | null - When the detection was created.
- **signal_date?**: string | null - Date of the underlying signal event (e.g. post publish date).
- **lead_id?**: integer | null - ID of the associated workspace lead. For detections without their own lead (e.g. keyword matches), this is the content author's lead when known. Null when the author is unknown.
- **company_id?**: integer | null - ID of the associated workspace company.
- **agent_id?**: integer | null - ID of the agent that produced this detection.

### V2SignalResponse

- **data**: object
  - **id**: integer - ID of the detection. Specific to your environment.
  - **signal_type?**: string | null - Signal type, e.g. "keywordDetection".
  - **data?**: oneOf:
    -       - **content_id?**: integer | null - ID of the content the keyword matched in. Fetch the full post via the Contents endpoints.

      - **author?**: oneOf:
        -           - **type**: string (profile)

          - **full_name?**: string | null
          - **headline?**: string | null - LinkedIn headline of the person.
          - **linkedin_url?**: string | null
        -           - **type**: string (company)

          - **company_name?**: string | null
          - **linkedin_url?**: string | null - Who published the post — a person or a company page (discriminated by `type`). Null when the publisher is unknown.
      - **keywords_found?**: Array<string> - The tracked keywords found in the post.
    -       - **interaction?**: object - The comment side of the interaction.

      - **type?**: string (comment)
      - **content_id?**: integer | null
      - **author?**: object - A person involved in a watchlist comment interaction.
        - **full_name?**: string | null
        - **linkedin_url?**: string | null
        - **headline?**: string | null - LinkedIn headline of the person.
      - **post?**: object - The post the comment was left on.
        - **content_id?**: integer | null
        - **author?**: object - A person involved in a watchlist comment interaction.
          - **full_name?**: string | null
          - **linkedin_url?**: string | null
          - **headline?**: string | null - LinkedIn headline of the person.
    -       - **previous_position?**: object - The role held before the change — fields are null when unknown.

      - **role?**: string | null
      - **company_name?**: string | null
      - **new_position?**: object - The new role.
        - **role?**: string | null
        - **company_name?**: string | null
        - **start_date?**: string | null - Start date as YYYY-MM-DD.
    -       - **title?**: string | null

      - **tag?**: string | null - Category of the event (e.g. funding).
      - **date?**: string | null
      - **sources?**: Array< - **url?**: string | null
        - **excerpts?**: Array<string>>
    -       - **posting?**: object

      - **title?**: string | null
      - **company_name?**: string | null
      - **job_url?**: string | null
      - **location?**: string | null
      - **description?**: string | null
      - **published_at?**: string | null
      - **job_title?**: string | null - Detection payload — the shape depends on `signal_type`:
- `keywordDetection` → `V2KeywordDetectionData`
- `*InboundComment` / `*OutboundComment` (watchlist) → `V2WatchlistCommentData`
- `newJob`, `recentlyPromoted` → `V2JobUpdateData`
- `deepSearch` → `V2DeepSearchData`
- `jobPosting`, `jobPostingInsight`, `jobPostingHiringManager` → `V2JobPostingData`

Other signal types return their payload as-is.

- **detected_at?**: string | null - When the detection was created.
- **signal_date?**: string | null - Date of the underlying signal event (e.g. post publish date).
- **lead_id?**: integer | null - ID of the associated workspace lead. For detections without their own lead (e.g. keyword matches), this is the content author's lead when known. Null when the author is unknown.
- **company_id?**: integer | null - ID of the associated workspace company.
- **agent_id?**: integer | null - ID of the agent that produced this detection.

### V2SignalListResponse

- **data**: Array< - **id**: integer - ID of the detection. Specific to your environment.
  - **signal_type?**: string | null - Signal type, e.g. "keywordDetection".
  - **data?**: oneOf:
    -       - **content_id?**: integer | null - ID of the content the keyword matched in. Fetch the full post via the Contents endpoints.

      - **author?**: oneOf:
        -           - **type**: string (profile)

          - **full_name?**: string | null
          - **headline?**: string | null - LinkedIn headline of the person.
          - **linkedin_url?**: string | null
        -           - **type**: string (company)

          - **company_name?**: string | null
          - **linkedin_url?**: string | null - Who published the post — a person or a company page (discriminated by `type`). Null when the publisher is unknown.
      - **keywords_found?**: Array<string> - The tracked keywords found in the post.
    -       - **interaction?**: object - The comment side of the interaction.

      - **type?**: string (comment)
      - **content_id?**: integer | null
      - **author?**: object - A person involved in a watchlist comment interaction.
        - **full_name?**: string | null
        - **linkedin_url?**: string | null
        - **headline?**: string | null - LinkedIn headline of the person.
      - **post?**: object - The post the comment was left on.
        - **content_id?**: integer | null
        - **author?**: object - A person involved in a watchlist comment interaction.
          - **full_name?**: string | null
          - **linkedin_url?**: string | null
          - **headline?**: string | null - LinkedIn headline of the person.
    -       - **previous_position?**: object - The role held before the change — fields are null when unknown.

      - **role?**: string | null
      - **company_name?**: string | null
      - **new_position?**: object - The new role.
        - **role?**: string | null
        - **company_name?**: string | null
        - **start_date?**: string | null - Start date as YYYY-MM-DD.
    -       - **title?**: string | null

      - **tag?**: string | null - Category of the event (e.g. funding).
      - **date?**: string | null
      - **sources?**: Array< - **url?**: string | null
        - **excerpts?**: Array<string>>
    -       - **posting?**: object

      - **title?**: string | null
      - **company_name?**: string | null
      - **job_url?**: string | null
      - **location?**: string | null
      - **description?**: string | null
      - **published_at?**: string | null
      - **job_title?**: string | null - Detection payload — the shape depends on `signal_type`:
- `keywordDetection` → `V2KeywordDetectionData`
- `*InboundComment` / `*OutboundComment` (watchlist) → `V2WatchlistCommentData`
- `newJob`, `recentlyPromoted` → `V2JobUpdateData`
- `deepSearch` → `V2DeepSearchData`
- `jobPosting`, `jobPostingInsight`, `jobPostingHiringManager` → `V2JobPostingData`

Other signal types return their payload as-is.

- **detected_at?**: string | null - When the detection was created.
- **signal_date?**: string | null - Date of the underlying signal event (e.g. post publish date).
- **lead_id?**: integer | null - ID of the associated workspace lead. For detections without their own lead (e.g. keyword matches), this is the content author's lead when known. Null when the author is unknown.
- **company_id?**: integer | null - ID of the associated workspace company.
- **agent_id?**: integer | null - ID of the agent that produced this detection.>
- **meta**: object
  - **next_cursor**: string | null - Opaque cursor to pass as `cursor` on the next request. Null when this is the last page.
  - **has_more**: boolean - Whether more results exist beyond this page.

### V2SignalCountResponse

- **total**: integer - Total number of signal detections matching the supplied filters.

### V2SignalsQueryBody

POST body for `POST /v2/workspace/signals/query`. All fields are optional.

- **cursor?**: string - Opaque pagination cursor. Pass the `next_cursor` value from the previous response to fetch the next page. Omit for the first page.
- **limit?**: integer - Number of items to return per page. Defaults to 25. Maximum: 100.
- **signal_start_date?**: string - Return detections whose signal date is on or after this timestamp (ISO 8601 with UTC offset).
- **signal_end_date?**: string - Return detections whose signal date is on or before this timestamp (ISO 8601 with UTC offset).
- **detection_start_date?**: string - Return detections that were first seen on or after this timestamp (ISO 8601 with UTC offset).
- **detection_end_date?**: string - Return detections that were first seen on or before this timestamp (ISO 8601 with UTC offset).
- **agent_id?**: integer - Return detections produced by a specific agent. Pass the numeric `agent_id` returned on each detection in the list response.
- **signal_run_id?**: integer - Return detections from a specific run. Pass the numeric run id returned by the signal-runs endpoint. Results are automatically scoped to your workspace. When no date filter is supplied, results default to the 90 days preceding the run's creation; pass any date filter to override.
- **type?**: Array<string (keywordDetection, newJob, recentlyPromoted, jobPostingKeywordDetection, competitorInboundComment, competitorOutboundComment, partnerInboundComment, partnerOutboundComment, customerInboundComment, customerOutboundComment, influencerInboundComment, influencerOutboundComment, championInboundComment, championOutboundComment)> - Filter results to one or more signal types; unknown values are rejected.
- **company_id?**: integer - Return detections for a specific company. Pass the numeric `company_id` returned in signal items — the same company ID used by `GET /v2/companies/{id}`. Taken at face value — no lookup is performed, so an ID that does not belong to your workspace returns an empty page rather than a `404`. Takes priority over all human-identifier fields below.
- **company_domain?**: Array<string> - Return detections for companies on your top-account list matching this domain. Native JSON array, maximum 100 values, OR filtering across multiple companies. See `company_id` for tier priority. Returns `404` when none of the supplied values resolve to a known company on your top-account list.
- **company_linkedin_handle?**: Array<string> - Return detections for companies on your top-account list matching this LinkedIn handle. Native JSON array, maximum 100 values. See `company_id` for tier priority. Returns `404` when none of the supplied values resolve to a known company on your top-account list.
- **company_linkedin_url?**: Array<string> - Return detections for companies on your top-account list matching this LinkedIn URL. Native JSON array, maximum 100 values. See `company_id` for tier priority. Returns `404` when none of the supplied values resolve to a known company on your top-account list.
- **lead_id?**: integer - Filter to signals linked to a specific lead. Use the `lead_id` returned by the signals endpoints; resolve details via `GET /v2/leads/{id}`. Only matches detections directly linked to the lead — not signals attributed to that lead through fallback matching.

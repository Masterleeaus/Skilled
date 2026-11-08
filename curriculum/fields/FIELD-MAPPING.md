# Business field matrix and template mapping

This maps each course to the 13 approved field groups in business-lesson-fields.json (56 fields). A value is only delivered once approved. Placeholders use the form {{business:group.field}}. Optional fields resolve to nothing until approved.

## Field groups and fields

- business: name, display_name, logo_url, support_phone, support_email, service_area, timezone
- services: enabled, service_group, vertical, service_description
- equipment: assigned_items, primary_tool, inspection_checklist, maintenance_schedule, manufacturer_manual_url
- materials: approved_products, sds_links, handling_procedure, storage_procedure, waste_procedure
- safety: required_ppe, site_hazards, emergency_contact, incident_reporting_procedure, escalation_contact
- procedures: approved_sop, prestart_checklist, task_steps, completion_checklist, quality_standard
- jobs: scheduling_method, arrival_procedure, time_tracking, photo_requirements, signoff_procedure
- customers: communication_policy, complaint_escalation, access_instructions
- quality: inspection_checklist, defect_reporting, evidence_requirements
- pricing: pricing_method, minimum_charge, materials_cost_policy, quoting_approval
- staff: role, supervisor_contact, authorised_tasks
- compliance: jurisdiction, licence_requirements, policy_reference
- assessment: business_question_set, practical_equipment, assessor_role, signoff_requirements

## Template terms mapped to approved fields

| Template term | Approved field |
|---|---|
| {role} | {{business:staff.role}} |
| {service} | {{business:services.service_description}} |
| {equipment} | {{business:equipment.primary_tool}} |
| {product} | {{business:materials.approved_products}} |
| {procedure} | {{business:procedures.approved_sop}} |
| {supervisor} | {{business:staff.supervisor_contact}} |
| {access} | {{business:customers.access_instructions}} |
| {licence} | {{business:compliance.licence_requirements}} |
| {jurisdiction} | {{business:compliance.jurisdiction}} |
| {price} | {{business:pricing.pricing_method}} |
| {escalation} | {{business:safety.escalation_contact}} |

Precedence (from the registry): canonical lesson, then service group, then vertical, then approved business context.

Compliance: "Y (licence)" marks courses that need licence fields. "Y (policy only)" means jurisdiction and policy fields only.

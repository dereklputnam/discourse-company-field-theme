import { withPluginApi } from "discourse/lib/plugin-api";

export default {
  name: "custom-field-visibility",

  initialize(container) {
    console.log("[Custom Field Visibility] Initializer starting...");

    withPluginApi("0.8", (api) => {
      // Get current user
      const currentUser = api.getCurrentUser();
      console.log("[Custom Field Visibility] Current user:", currentUser?.username);

      if (!currentUser) {
        console.log("[Custom Field Visibility] No current user - exiting");
        return;
      }

      // Get field visibility rules from settings
      const rules = settings.field_visibility_rules;

      console.log("[Custom Field Visibility] Rules:", rules);

      if (!rules || rules.length === 0) {
        console.log("[Custom Field Visibility] No rules configured - exiting");
        return;
      }

      // Get user groups for comparison
      const userGroups = currentUser.groups || [];
      const userGroupNames = userGroups.map(g => g.name);
      console.log("[Custom Field Visibility] User groups:", userGroupNames);

      // Get site user fields
      const site = container.lookup("service:site");
      const userFields = site.get("user_fields");
      console.log("[Custom Field Visibility] Available user fields:", userFields);

      if (!userFields) {
        console.log("[Custom Field Visibility] No user fields available - exiting");
        return;
      }

      // Process each rule
      rules.forEach((rule, index) => {
        console.log(`[Custom Field Visibility] Processing rule ${index + 1}:`, rule);

        const customField = userFields.find(
          (field) => field.name.toLowerCase() === rule.field_name.toLowerCase()
        );

        if (!customField) {
          console.log(`[Custom Field Visibility] Field '${rule.field_name}' not found - skipping`);
          return;
        }

        console.log(`[Custom Field Visibility] Found field '${rule.field_name}':`, customField);

        // Hide this field by default for everyone
        const fieldId = customField.id;
        const fieldName = customField.dasherized_name || customField.name.toLowerCase().replace(/\s+/g, '-');

        const style = document.createElement('style');
        style.id = `custom-field-visibility-${fieldId}`;
        style.innerHTML = `
          .public-user-field.${fieldName} { display: none !important; }
          .public-user-field.public-user-field__${fieldName} { display: none !important; }
          .user-card .public-user-field.${fieldName} { display: none !important; }
          .user-card .public-user-field__${fieldName} { display: none !important; }
          .user-field-${fieldId} { display: none !important; }
          .user-profile-fields .user-field-${fieldId} { display: none !important; }
          .public-user-fields .user-field-${fieldId} { display: none !important; }
          .collapsed-info .user-field[data-field-id="${fieldId}"] { display: none !important; }
        `;
        document.head.appendChild(style);
        console.log(`[Custom Field Visibility] Injected CSS to hide field ID: ${fieldId}, name: ${fieldName}`);

        // Check if user is in any of the allowed groups for this rule
        // Parse comma-separated string into array
        const allowedGroupsStr = rule.allowed_groups || "";
        const allowedGroups = allowedGroupsStr.split(',').map(g => g.trim()).filter(g => g.length > 0);
        const isInAllowedGroup = allowedGroups.some(group => userGroupNames.includes(group));
        console.log(`[Custom Field Visibility] User in any of groups ${JSON.stringify(allowedGroups)}?`, isInAllowedGroup);

        if (isInAllowedGroup) {
          document.body.classList.add(`show-custom-field-${fieldId}`);
          console.log(`[Custom Field Visibility] Added body class: show-custom-field-${fieldId}`);
        }
      });
    });
  }
};

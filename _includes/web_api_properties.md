<!-- prettier-ignore-start -->

{%- for field in site.data.spec.web_api.fields %}
- `{{ field.id }}` (`{{ field.type }}`{% if field.required %}, **required**{% else %}, optional{% endif %}): {{ field.description }}
{%- endfor %}

<!-- prettier-ignore-end -->

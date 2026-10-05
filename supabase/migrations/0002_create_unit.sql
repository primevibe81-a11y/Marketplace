create or replace function public.create_unit_with_identifiers(
  p_model_id uuid,
  p_grade text,
  p_source_type text,
  p_source_ref text,
  p_acquired_price bigint,
  p_extra_cost bigint,
  p_imei1 text,
  p_imei2 text,
  p_serial text
) returns jsonb language plpgsql security invoker as $$
declare
  v_unit_id uuid;
  v_code text;
  v_dup_code text;
begin
  -- Check for duplicates first to provide a friendly error message
  if p_imei1 is not null then
    select u.code into v_dup_code from public.unit_identifiers i join public.units u on i.unit_id = u.id where i.value = p_imei1 limit 1;
    if v_dup_code is not null then
      raise exception 'IMEI sudah dipakai unit %', v_dup_code;
    end if;
  end if;
  
  if p_imei2 is not null then
    select u.code into v_dup_code from public.unit_identifiers i join public.units u on i.unit_id = u.id where i.value = p_imei2 limit 1;
    if v_dup_code is not null then
      raise exception 'IMEI sudah dipakai unit %', v_dup_code;
    end if;
  end if;
  
  if p_serial is not null then
    select u.code into v_dup_code from public.unit_identifiers i join public.units u on i.unit_id = u.id where i.value = p_serial limit 1;
    if v_dup_code is not null then
      raise exception 'Serial sudah dipakai unit %', v_dup_code;
    end if;
  end if;

  -- Insert unit
  insert into public.units (
    model_id, grade, source_type, source_ref, acquired_price, extra_cost
  ) values (
    p_model_id, p_grade, p_source_type, p_source_ref, p_acquired_price, p_extra_cost
  ) returning id, code into v_unit_id, v_code;

  -- Insert identifiers
  if p_imei1 is not null then
    insert into public.unit_identifiers (unit_id, kind, value) values (v_unit_id, 'imei1', p_imei1);
  end if;
  
  if p_imei2 is not null then
    insert into public.unit_identifiers (unit_id, kind, value) values (v_unit_id, 'imei2', p_imei2);
  end if;
  
  if p_serial is not null then
    insert into public.unit_identifiers (unit_id, kind, value) values (v_unit_id, 'serial', p_serial);
  end if;

  return jsonb_build_object('id', v_unit_id, 'code', v_code);
end;
$$;

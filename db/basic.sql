insert into srdbasic (linkid, body, chapter, section)
  values ($1, $2, $3, $4)
ON CONFLICT (linkid)
DO Update
  set body = $2, chapter = $3, section = $4